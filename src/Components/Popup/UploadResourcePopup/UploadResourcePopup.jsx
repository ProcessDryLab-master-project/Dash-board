import './UploadResourcePopup.scss';
import {useState, useEffect} from 'react';
import PopupFooter from '../../Widgets/PopupFooter/PopupFooter';
import PopupHeader from '../../Widgets/PopupHeader/PopupHeader';
import {getRepositories} from '../../../Store/LocalDataStore';
import BackdropModal from '../../Widgets/BackdropModal/BackdropModal';
import { sendFileToRepository } from '../../../Services/RepositoryServices';
import Tabs from '../../Tabs/Tabs';
import UploadFileBody from './UploadFileBody/UploadFileBody';
import UploadStreamBody from './UploadStreamBody/UploadStreamBody';

function UploadResourcePopup(props) {

    const {
        toggleFilePopupOpen,
        repository = {},
    } = props;

    const [isLoading, setIsLoading] = useState(true);
    const [fileDestination, setFileDestination] = useState({});

    const [selectedFile, setSelectedFile] = useState();
	const [isFilePicked, setIsFilePicked] = useState(false);
    const [selectedFileType, setSelectedFileType] = useState(null);

    const [fileDescription, setFileDescription] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const [streamBrokerLocation, setStreamBrokerLocation] = useState(null);
    const [streamTopic, setStreamTopic] = useState(null);


       


    useEffect(() => {
        setIsLoading(false);
        setFileDestination(repository);
    }, []);

    if(isLoading){
        return (
            <div className="UploadResourcePopup">
                <div>Loading ...</div>
            </div>
        )
    }

    const onTabChange = (tabIndex) => {
        setSelectedTab(tabIndex);
    }
    const fileTabs = [{title: 'File'}, {title: 'Stream'}];
    
    const onFileUploadValueChange = (event) => {
        setSelectedFile(event.target.files[0]);
		setIsFilePicked(true);
    }

    const onFileDestinationDropdownChange = (value) => {
        setFileDestination(value)
    }

    const onFileDescriptionChange = (res) => {
        setFileDescription(res.value);
    }

    const onConfirmClick = () => {
        if(isFilePicked && 
            fileDestination !== null && fileDestination !== undefined
            && selectedFileType !== null && selectedFileType !== undefined){
            sendFileToRepository(fileDestination.label, selectedFile, selectedFileType.value, fileDescription).then(() => {
                const reader = new FileReader();
                reader.readAsText(selectedFile, 'UTF-8');
                // console.log();
                reader.onload = function (evt) {
                    console.log(evt.target.result);
                }
            });
        }
    }

    const repositories = getRepositories().map((repository, index) => {
        return {label: repository.name, value: repository.id}
    })

    const radiobuttonsFile = [
        {label: "Raw data/event log", value: "EventLog"},
        {label: "Visualization/processed data", value: "Visualization"},
    ];

    const onRadioButtonChange = (value) => {
        setSelectedFileType(value);
    }

    const onStreamBrokerLocationChange = (res) => {
        setStreamBrokerLocation(res.value);
    }
    const onStreamTopicChange = (res) => {
        setStreamTopic(res.value);
    }

    return (
            <BackdropModal closeModal = {toggleFilePopupOpen}>

            <div className='UploadResourcePopup' 
                onClick = {(e) => {e.stopPropagation()}}
            >

                <PopupHeader
                    title = {`Upload file`}
                    closePopup = {toggleFilePopupOpen}
                />

                <Tabs
                    onTabChange = {onTabChange}
                    selectedTab = {selectedTab}
                    tablist = {fileTabs}
                />
                
                <div className='UploadResourcePopup-body'>
                    
                    {(selectedTab === 0) && <UploadFileBody
                        selectedFile = {selectedFile}
                        onFileUploadValueChange = {onFileUploadValueChange}
                        radiobuttonsOptions = {radiobuttonsFile}
                        onRadioButtonChange = {onRadioButtonChange}
                        fileDescription = {fileDescription}
                        onFileDescriptionChange = {onFileDescriptionChange}
                        repositories = {repositories}
                        onFileDestinationDropdownChange = {onFileDestinationDropdownChange}
                        fileDestination = {fileDestination}
                        selectedFileType = {selectedFileType}
                    />}

                    {(selectedTab === 1) && <UploadStreamBody
                        onStreamBrokerLocationChange = {onStreamBrokerLocationChange}
                        onStreamTopicChange = {onStreamTopicChange}
                        fileDescription = {fileDescription}
                        onFileDescriptionChange = {onFileDescriptionChange}
                        repositories = {repositories}
                        onFileDestinationDropdownChange = {onFileDestinationDropdownChange}
                        fileDestination = {fileDestination}
                        streamBrokerLocation = {streamBrokerLocation}
                        streamTopic = {streamTopic}
                    />}
                    
                </div>

                <PopupFooter
                    onCancelClick = {toggleFilePopupOpen}
                    onNextClick = {onConfirmClick}
                    cancelText = {`Cancel`}
                    nextText = {`Confirm`}
                />

            </div>
        </BackdropModal>
    );
}

export default UploadResourcePopup;
