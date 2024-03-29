import './ProcessOverviewPopup.scss';
import {useState, useEffect, useCallback, useRef} from 'react';
import BackdropModal from '../../Widgets/BackdropModal/BackdropModal';
import ProcessOverviewCard from './ProcessOverviewCard/ProcessOverviewCard';
import LoadingSpinner from '../../Widgets/LoadingSpinner/LoadingSpinner';
import {getAllActionProcessesLocal, getProcessLocal, setProcessKeyLocalAsync, removeProcessLocal} from '../../../Store/LocalDataStore';
import Dropdown from '../../Widgets/Dropdown/Dropdown';
import {StopMinerProcess} from '../../../Services/MinerServices';
import Popup from '../../Widgets/Popup/Popup';

function ProcessOverviewPopup(props) {

    const {
        toggleProcessOverviewPopupOpen,
        setComponentUpdaterFunction,
        openInformationPrompt,
    } = props;

    const sortType = {
        startTimeAsc: "sAsc",
        startTimeDsc: "sDsc",
        endTimeAsc: "eAsc",
        endTimeDsc: "eDsc",
    }

    const [isLoading, setIsLoading] = useState(true);
    const [processes, setProcesses] = useState([]);
    const [selectedSorting, setSelectedSorting] = useState(null);
    const sortingRef = useRef(null);

    const [, updateState] = useState();
    const forceUpdate = useCallback(() =>{ 
        updateState({});
        setProcesses(sortProcesses(getAllActionProcessesLocal(), sortingRef.current?.value ? sortingRef.current?.value : sortType.type));
    }, []);

    useEffect (() => {
        if(!selectedSorting){
            setSelectedSorting({value: sortType.endTimeDsc, label: "Finished Descending"});
        }
        setComponentUpdaterFunction("ProcessOverviewPopup", {update: forceUpdate})
        setProcesses(sortProcesses(getAllActionProcessesLocal(), selectedSorting?.value ? selectedSorting?.value : sortType.type));
        setIsLoading(false);
    }, []);

    const sortingOptions = [
        {value: sortType.startTimeAsc, label: "Started Ascending"},
        {value: sortType.startTimeDsc, label: "Started Descending"},
        {value: sortType.endTimeAsc, label: "Finished Ascending"},
        {value: sortType.endTimeDsc, label: "Finished Descending"},
    ]

    const onSortingDropdownValueChange = (value) => {
        setProcesses(sortProcesses(getAllActionProcessesLocal(), value.value));
        setSelectedSorting(value);
        sortingRef.current = value;
    }

    const sortProcesses = (processes, sort) => {
        const completedProcesses = processes.filter(process => process.status.toUpperCase() === "COMPLETE");
        const runningProcesses = processes.filter(process => process.status.toUpperCase() === "RUNNING");
        const stoppedProcesses = processes.filter(process => process.status.toUpperCase() === "STOPPED");
        const errorProcesses = processes.filter(process => process.status.toUpperCase() === "ERROR");
        const otherProcesses = processes.filter(process => process.status.toUpperCase() !== "COMPLETE" && process.status.toUpperCase() !== "RUNNING" && process.status.toUpperCase() !== "STOPPED" && process.status.toUpperCase() !== "ERROR");

        switch(sort){
            case sortType.startTimeAsc:
                return (
                    sortProcessesAsc(runningProcesses, "startTime").concat(
                    sortProcessesAsc(completedProcesses, "startTime")).concat(
                    sortProcessesAsc(stoppedProcesses, "startTime")).concat(
                    sortProcessesAsc(errorProcesses, "startTime")).concat(
                    sortProcessesAsc(otherProcesses, "startTime"))
                );
            case sortType.startTimeDsc:
                return (
                    sortProcessesDsc(runningProcesses, "startTime").concat(
                    sortProcessesDsc(completedProcesses, "startTime")).concat(
                    sortProcessesDsc(stoppedProcesses, "startTime")).concat(
                    sortProcessesDsc(errorProcesses, "startTime")).concat(
                    sortProcessesDsc(otherProcesses, "startTime"))
                );
            case sortType.endTimeAsc:
                return (
                    sortProcessesAsc(runningProcesses, "endTime").concat(
                    sortProcessesAsc(completedProcesses, "endTime")).concat(
                    sortProcessesAsc(stoppedProcesses, "endTime")).concat(
                    sortProcessesAsc(errorProcesses, "endTime")).concat(
                    sortProcessesAsc(otherProcesses, "endTime"))
                );
            case sortType.endTimeDsc:
                return (
                    sortProcessesDsc(runningProcesses, "endTime").concat(
                    sortProcessesDsc(completedProcesses, "endTime")).concat(
                    sortProcessesDsc(stoppedProcesses, "endTime")).concat(
                    sortProcessesDsc(errorProcesses, "endTime")).concat(
                    sortProcessesDsc(otherProcesses, "endTime"))
                );
            default:
                return (
                    sortProcessesAsc(runningProcesses, "startTime").concat(
                    sortProcessesAsc(completedProcesses, "startTime")).concat(
                    sortProcessesAsc(stoppedProcesses, "startTime")).concat(
                    sortProcessesAsc(errorProcesses, "startTime")).concat(
                    sortProcessesAsc(otherProcesses, "startTime"))
                );
        }
    }

    const sortProcessesAsc = (processes, time) => {
        if(time === "startTime"){
            return processes.sort((a, b) => {
                return a.startTime - b.startTime;
            });
        }
        else if(time === "endTime"){
            return processes.sort((a, b) => {
                if(a.endTime === null && b.endTime === null) {
                    return a.startTime - b.startTime;
                }
                else if(a.endTime === null){
                    return -1;
                }
                else if(b.endTime === null){
                    return 1;
                }
                return a.endTime - b.endTime;
            });
        }  
    }

    const sortProcessesDsc = (processes, time) => {
        if(time === "startTime"){
            return processes.sort((a, b) => {
                return b.startTime - a.startTime;
            });
        }
        else if (time === "endTime"){
            return processes.sort((a, b) => {
                if(a.endTime === null && b.endTime === null) {
                    return a.startTime - b.startTime;
                }
                else if(a.endTime === null){
                    return 1;
                }
                else if(b.endTime === null){
                    return -1;
                }
                return b.endTime - a.endTime;
            });
        }
    }

    if(isLoading){
        return (
            <div className="ProcessOverviewPopup">
                <div className='Spinner-container-l'>
                    <LoadingSpinner loading={isLoading}/>
                </div>
            </div>
        )
    }

    const stopProcess = (processId) => {
        const process = getProcessLocal(processId);

        StopMinerProcess(process.hostname, process.processId).then((response) => {
            setProcessKeyLocalAsync(processId, "status", "stopped");
        }).catch((error) => {
            console.log(error);
        });
    }

    const deleteProcess = (processId) => {
        removeProcessLocal(processId);
        forceUpdate();
    }

    return (
        <BackdropModal closeModal = {toggleProcessOverviewPopupOpen}>
            <Popup
                closePopup = {toggleProcessOverviewPopupOpen}
                title = {`Process Overview`}
                showFooter = {false}
            >
                {<div className='ProcessOverviewPopup-sorting-container'>
                    <Dropdown
                        options = {sortingOptions}
                        onValueChange = {onSortingDropdownValueChange}
                        label = {`Sort By:`}
                        value = {selectedSorting}
                        labelPosition = {"left"}
                    />
                </div>}
                {processes.length > 0 && 
                    <div className='ProcessOverviewPopup-body'>
                        {processes.map((process) => {
                            return (
                                <ProcessOverviewCard
                                    key = {process.processId}
                                    process = {process}
                                    stopProcess = {stopProcess}
                                    deleteProcess = {deleteProcess}
                                    openInformationPrompt = {openInformationPrompt}
                                />
                            )
                        })}
                    </div>
                }

                {processes.length === 0 && 
                    <div>
                        There are no processes to display.
                    </div>
                }
            </Popup>
        </BackdropModal>
    );
}

export default ProcessOverviewPopup;
