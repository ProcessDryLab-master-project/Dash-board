import './Sidebar.scss';
import Button from '../Widgets/Button/Button';
import {useState, useEffect, useCallback} from 'react';
import { FaCircle, FaCog, FaFileUpload, FaBuffer } from 'react-icons/fa';
import SidebarFile from './SidebarFiles/SidebarFile';
import { getAllFiles, getAllStatus } from '../../Store/LocalDataStore';
import { getFileResourceId } from '../../Utils/FileUnpackHelper';
import LoadingSpinner from '../Widgets/LoadingSpinner/LoadingSpinner';

function Sidebar(props) {

    const {
        openPopup,
        popups,
        deleteFile,
        selectFileForVisualization,
        // setUpdateSidebar
        shouldSetFileContent,
        setComponentUpdaterFunction,
        selectedFile,
    } = props;

    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const [, updateState] = useState();
    const forceUpdate = useCallback(() =>{ 
        updateState({}); 
        setFiles(getAllFiles());
        setStatuses(getAllStatus());
    }, []);

    useEffect(() => {
        setComponentUpdaterFunction("Sidebar", {update: forceUpdate});
        setIsLoading(false);
    }, []);

    useEffect(() => {
        setFiles(getAllFiles());
        setStatuses(getAllStatus());
    }, []);    

    const statusIconDisplayer = () => {
        const uniqueStatus = getAllStatus().filter((x, i, a) => a.indexOf(x) === i)
        if(uniqueStatus.includes('online') && uniqueStatus.includes('offline')){ // if both true and false are present
            return <FaCircle className='Sidebar-status-icon-yellow'/>
        } else if (uniqueStatus.includes('online') && !uniqueStatus.includes('offline')){ // if only true is present
            return <FaCircle className='Sidebar-status-icon-green'/>
        } else if (uniqueStatus.includes('offline') && !uniqueStatus.includes('online')){ // if only false is present
            return <FaCircle className='Sidebar-status-icon-red'/>
        } else if (uniqueStatus.length === 0){
            return <FaCircle className='Sidebar-status-icon-grey'/>
        }
    }

    const statusTextDisplayer = () => {
        const uniqueStatus = getAllStatus().filter((x, i, a) => a.indexOf(x) === i)
        if(uniqueStatus.includes('online') && uniqueStatus.includes('offline')){ // if both true and false are present
            return <span>Some systems offline</span>
        } else if (uniqueStatus.includes('online') && !uniqueStatus.includes('offline')){ // if only true is present
            return <span>All systems online</span>
        } else if (uniqueStatus.includes('offline') && !uniqueStatus.includes('online')){ // if only false is present
            return <span>All systems offline</span>
        } else if (uniqueStatus.length === 0){
            return <span>No hosts connected</span>
        }
    }


    if(isLoading){
        return (
            <div className="Sidebar">
                <div className='Spinner-container-l'>
                    <LoadingSpinner loading={isLoading}/>
                </div>
            </div>
        )
    }

    return (
        <div className={`Sidebar`}>
            <div className='Sidebar-flexContainer'>
                <div className='Sidebar-flexContainer-top'>
                    <div className='Sidebar-flexContainer-buttons'>
                        <Button
                            text = {`Upload resource`}
                            icon = {<FaFileUpload/>}
                            disabled = {false}
                            className = {``}
                            onClick = {() => {openPopup(popups.AddFilePopup)}}
                        />
                        <Button
                            text = {`Execute action`}
                            icon = {<FaCog/>}
                            disabled = {false}
                            className = {``}
                            onClick = {() => {openPopup(popups.ActionPopup)}}
                        />
                        <Button
                            text = {`Add new host`}
                            icon = {<FaBuffer/>}
                            disabled = {false}
                            className={``}
                            onClick = {() => {openPopup(popups.AddNewHostPopup)}}
                        />
                    </div>
                    <div className='Sidebar-flexContainer-files'>
                        {
                            files.map((file, index) => {
                                const fileId = getFileResourceId(file);
                                const isSelected = selectedFile ? getFileResourceId(selectedFile) === getFileResourceId(file) : false;
                                return(
                                    <SidebarFile key={index}
                                        openPopup = {openPopup}
                                        popups = {popups}
                                        deleteFile = {deleteFile}
                                        fileId = {fileId}
                                        selectFileForVisualization = {selectFileForVisualization}
                                        shouldSetFileContent = {shouldSetFileContent}
                                        isSelected = {isSelected}
                                    />
                                )
                            })
                        }
                    </div>
                </div>
                <div className='Sidebar-flexContainer-actions'>
                    {/* <div>
                        {
                            getFilesOfType("png").map((file) => {
                                return <img src={file.fileContent}></img>
                            })
                        }
                    </div> */}
                </div>
                <div className='Sidebar-flexContainer-status'>
                    <div className='Sidebar-status'>
                        <div className='Sidebar-status-icon'>
                            {/* <FaCircle/> */}
                            {statusIconDisplayer()}
                        </div>
                        <div className='Sidebar-status-text'>
                            {/* All systems online */}
                            {statusTextDisplayer()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
