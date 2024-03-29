import './App.css';
import {useState, useEffect, useRef} from 'react';
import Home from './Pages/Home/Home';
import Page1 from './Pages/Page1/Page1';
import { saveHostLocal, removeHostLocal, saveFileLocal, getFileLocal, removeFileLocal } from './Store/LocalDataStore';
import { pingAllAddedServices, pingAllActionProcesses, getAndSaveAllHostConfig, pingAllShadowProcesses } from './Utils/ServiceHelper';
import { GetFileImage, GetFileText } from './Services/RepositoryServices';
import { GetMinerConfig } from './Services/MinerServices';
import { GetRepositoryConfig, GetHistogramOfLog } from './Services/RepositoryServices';
import { getFileExtension, getFileResourceId, getFileResourceType, getFileRepositoryUrl, getFileProcessId, getFileResourceLabel } from './Utils/FileUnpackHelper';
import { pingHostInterval, pingMinerProcessInterval, pingShadowProcessInterval } from './config';
import LoadingSpinner from './Components/Widgets/LoadingSpinner/LoadingSpinner';
import {v4 as uuidv4} from 'uuid';
import InformationPrompt from './Components/Widgets/InformationPrompt/InformationPrompt';

function App(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true); // Is sidebar open
    const [sidebarHostsOpen, setSidebarHostsOpen] = useState(false); // Is sidebarhost open
    const [updateComponents, setUpdateComponents] = useState([]); // force rerender child components

    // --------------- Is Popup open ----------------
    const [filePopupOpen, setFilePopupOpen] = useState(false);
    const [actionPopupOpen, setActionPopupOpen] = useState(false);
    const [newHostPopupOpen, setNewHostPopupOpen] = useState(false);
    const [newHostFromSROpen, setNewHostFromSRPopupOpen] = useState(false);
    const [ViewResourcePopupOpen, setViewResourcePopupOpen] = useState(false); 
    const [processOverviewPopupOpen, setProcessOverviewPopupOpen] = useState(false);
    const [uploadManualChangesPopup, setUploadManualChangesPopup] = useState(false);
    const [shadowPopupOpen, setShadowPopupOpen] = useState(false);
    const [isInformationPromptOpen, setIsInformationPromptOpen] = useState(false);

    // --------------- Interval refs to ensure only one loop is running ----------------
    let pingInterval = useRef(null); 
    let pingProcessInterval = useRef(null);
    let pingShadowInterval = useRef(null);

    //Toggle functions
    const toggleSidebar = () => { setSidebarOpen(!sidebarOpen); }
    const toggleSidebarHosts = () => { setSidebarHostsOpen(!sidebarHostsOpen); }
    const toggleFilePopupOpen = () => { setFilePopupOpen(!filePopupOpen); }
    const toggleActionPopupOpen = () => { setActionPopupOpen(!actionPopupOpen); }
    const toggleNewHostPopupOpen = () => { setNewHostPopupOpen(!newHostPopupOpen); }
    const togglenewHostFromSRPopupOpen = () => { setNewHostFromSRPopupOpen(!newHostFromSROpen); }
    const toggleViewResourcePopupOpen = () => { setViewResourcePopupOpen(!ViewResourcePopupOpen); }
    const toggleProcessOverviewPopupOpen = () => { setProcessOverviewPopupOpen(!processOverviewPopupOpen); }
    const toggleUploadManualChangesPopup = () => { setUploadManualChangesPopup(!uploadManualChangesPopup); }
    const toggleShadowPopupOpen = () => { setShadowPopupOpen(!shadowPopupOpen); }
    const toggleIsInformationPromptOpen = () => { setIsInformationPromptOpen(!isInformationPromptOpen); }
    const [InformationPromptInfo, setIsInformationPromptInfo] = useState({});

    useEffect(() => {
        clearInterval(pingInterval.current);
        clearInterval(pingProcessInterval.current);
        clearInterval(pingShadowInterval.current);

        startPingHosts();
        startPingProcesses();
        startPingShadowProcesses();

        getAndSaveAllHostConfig();
        setIsLoading(false);
    }, []);

    const startPingHosts = () => {
        if(pingInterval.current !== null) clearInterval(pingInterval.current);
        pingInterval.current = setInterval(() => {
            pingAllAddedServices().then(() => {
                if(updateComponents.SidebarHosts){
                    updateComponents.SidebarHosts.update();
                }
            });
        }, pingHostInterval);
    }

    const startPingProcesses = () => {
        if(pingProcessInterval.current !== null) clearInterval(pingProcessInterval.current);
        pingProcessInterval.current = setInterval(() => {
            pingAllActionProcesses(getAndAddFile).then(() => {
                if(updateComponents.ProcessOverviewPopup){
                    setTimeout(() => {
                        updateComponents.ProcessOverviewPopup.update();
                    }, 200)
                }
            });
        }, pingMinerProcessInterval);
    }

    const startPingShadowProcesses = () => {
        if(pingShadowInterval.current !== null) clearInterval(pingShadowInterval.current);
        pingShadowInterval.current = setInterval(() => {
            pingAllShadowProcesses(addOrUpdateHost, openInformationPrompt).then(() => {
                if(updateComponents.SidebarHosts){
                    updateComponents.SidebarHosts.update();
                }
            });
        }, pingShadowProcessInterval)
    }

    const setComponentUpdaterFunction = (componentName, updateFunc) => {
        let updateComponentsTemp = updateComponents;
        updateComponentsTemp[componentName] = updateFunc;
        setUpdateComponents(updateComponentsTemp);
    }

    const handleAddHostOfType = async (type, hostname) => {
        switch(type){
            case 'miner': return GetMinerConfig(hostname)
            case 'repository': return GetRepositoryConfig(hostname)
            case 'service registry': return null;
            default: return null;
        }
    }

    const addOrUpdateHost = (name, type, addedFrom, id = null, status = "offline") => {

        const hostObject = {
            id: id ? id : uuidv4(),
            name: name,
            status: status,
            type: {label: type, value: type},
            addedFrom: addedFrom,
        }

        console.log(hostObject);

        handleAddHostOfType(type, name).then((res) => {
            hostObject.config = res?.data;
            saveHostLocal(hostObject.id, hostObject);
            if(updateComponents.SidebarHosts){
                updateComponents.SidebarHosts.update();
            }
        })
    }

    const deleteHost = (id) => {
        removeHostLocal(id);
        if(updateComponents.SidebarHosts){
            updateComponents.SidebarHosts.update();
        }
    }

    const shouldSetFileContent = (file) => {
        if(!file) return false;
        if(getFileResourceType(file).toUpperCase() === "EVENTSTREAM"){
            return false;
        }

        const fileExtension = getFileExtension(file).toUpperCase();
        switch(fileExtension){
            case "XES": return false;
            case "BPMN": return true;
            case "PNG": return true;
            case "JPG": return true;
            case "DOT": return true;
            case "PNML": return true;
            default: return true;
        }
    }

    const getAndAddFile = (file, retry = false, retries = 0) => {
        if(!file || retries >= 10) {
            alert(`Could not get file "${getFileResourceLabel(file)}" from host ${getFileRepositoryUrl(file)}`);
            return;
        }

        const resourceId = getFileResourceId(file);
        const currentFile = getFileLocal(resourceId);

        // If there is reason to get the metadata again, the response won't contain these values created on initialize.
        if(getFileProcessId(currentFile) || getFileRepositoryUrl(currentFile)){
            file["processId"] = getFileProcessId(currentFile);
            file["repositoryUrl"] = getFileRepositoryUrl(currentFile);
        }

        const fileExtension = getFileExtension(file);
        const host = getFileRepositoryUrl(file);

        saveFileLocal(resourceId, file); // save the metadata without filecontent
        setTimeout(() => { updateComponents.Sidebar.update() }, 500);

        let responsePromise;
        const isImage = fileExtension && (fileExtension.toUpperCase() === "PNG" || fileExtension.toUpperCase() === "JPG" || fileExtension.toUpperCase() === "SVG");
        if(shouldSetFileContent(file)){
            if(isImage) responsePromise = GetFileImage(host, resourceId);
            else responsePromise = GetFileText(host, resourceId); 
        }
        else if (fileExtension && fileExtension.toUpperCase() === "XES") {
            responsePromise = GetHistogramOfLog(host, resourceId);
        }
        if(responsePromise)
            responsePromise
            .then((res) => {
                if(res.status === 200 && res.data && getFileLocal(resourceId)) { // file could have been removed before completed
                    saveFileAndUpdate(file, res.data, isImage);
                }
            })
            .catch((err) => {
                if(retry) setTimeout(() => getAndAddFile(file, true, retries + 1), 3000);
            })
    }

    const saveFileAndUpdate = (file, fileContent, isImage) => {
        if (isImage) {
            var reader = new FileReader();
            reader.readAsDataURL(fileContent);
            reader.onload = (e) => {
                saveFileLocal(getFileResourceId(file), {...file, fileContent: e.target.result }); // save the filecontent as a base64 string
            };
        } else {
            saveFileLocal(getFileResourceId(file), {...file, fileContent: fileContent }); // save the filecontent
        }
        setTimeout(() => { updateComponents.Sidebar.update() }, 500);
    }

    const deleteFile = (id) => { //Deletes from local memory - not repository
        removeFileLocal(id);
        if(updateComponents.Sidebar){
            updateComponents.Sidebar.update();
        }
    }

    const openInformationPrompt = ({
        title, 
        text, 
        setTimeoutClose, 
        closeButtonText, 
        onClosePrompt,
        disabled,
        closePrimary,
        hasAccept,
        acceptButtonText,
        acceptPrimary ,
        onAcceptPrompt,
    }) => {
        setIsInformationPromptInfo({
            text: text ? text : "",
            title: title ? title : "",
            closeButtonText: closeButtonText ? closeButtonText : "Close",
            onClosePrompt: (onClosePrompt !== null && onClosePrompt !== undefined) ? onClosePrompt : () => setIsInformationPromptOpen(false),
            disabled: (disabled !== null && disabled !== undefined) ? disabled : false,
            closePrimary: (closePrimary !== null && closePrimary !== undefined) ? closePrimary : true,
            setTimeoutClose: (setTimeoutClose !== null && setTimeoutClose !== undefined) ? setTimeoutClose : true,
            hasAccept: (hasAccept !== null && hasAccept !== undefined) ? hasAccept : false,
            acceptButtonText: acceptButtonText ? acceptButtonText : "",
            acceptPrimary: (acceptPrimary !== null && acceptPrimary !== undefined) ? acceptPrimary : true,
            onAcceptPrompt:  (onAcceptPrompt !== null && onAcceptPrompt !== undefined) ? onAcceptPrompt : (() => {})(),
        });
        setIsInformationPromptOpen(true);
    }   

    if(isLoading){
        return (
            <div className="App">
                <div className='App-Loading-container'>
                    <div className='Spinner-container-l'>
                        <LoadingSpinner loading={isLoading}/>
                    </div>
                    <div className='App-Loading-text'>
                        Please wait while the application loads...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="App">
            {props.page === "Home" ? <Home 
                addOrUpdateHost = {addOrUpdateHost}
                removeHost = {deleteHost}
                getAndAddFile = {getAndAddFile}
                deleteFile = {deleteFile}
                updateComponents = {updateComponents}
                shouldSetFileContent = {shouldSetFileContent}
                saveFileAndUpdate = {saveFileAndUpdate}
                openInformationPrompt = {openInformationPrompt}
                toggles = {{
                    toggleSidebar,
                    toggleSidebarHosts,
                    toggleFilePopupOpen,
                    toggleActionPopupOpen,
                    toggleNewHostPopupOpen,
                    togglenewHostFromSRPopupOpen,
                    toggleViewResourcePopupOpen,
                    toggleProcessOverviewPopupOpen,
                    toggleUploadManualChangesPopup,
                    toggleShadowPopupOpen,
                    toggleIsInformationPromptOpen
                }}
                set = {{
                    setSidebarOpen,
                    setSidebarHostsOpen,
                    setFilePopupOpen,
                    setActionPopupOpen,
                    setNewHostPopupOpen,
                    setNewHostFromSRPopupOpen,
                    setViewResourcePopupOpen,
                    setComponentUpdaterFunction,
                    setProcessOverviewPopupOpen,
                    setUploadManualChangesPopup,
                    setShadowPopupOpen,
                    setIsInformationPromptOpen
                }}
                isOpen = {{
                    sidebarOpen,
                    sidebarHostsOpen,
                    filePopupOpen,
                    actionPopupOpen,
                    newHostPopupOpen,
                    newHostFromSROpen,
                    ViewResourcePopupOpen,
                    processOverviewPopupOpen,
                    uploadManualChangesPopup,
                    shadowPopupOpen,
                    isInformationPromptOpen,
                }}
            /> : null}
            {isInformationPromptOpen ?
                <InformationPrompt
                    text = {InformationPromptInfo.text}
                    title= {InformationPromptInfo.title}
                    closeButtonText = {InformationPromptInfo.closeButtonText}
                    onClosePrompt = {InformationPromptInfo.onClosePrompt}//{toggles.toggleIsInformationPromptOpen}
                    disabled = {InformationPromptInfo.disabled}
                    closePrimary = {InformationPromptInfo.closePrimary}
                    setTimeoutClose = {InformationPromptInfo.setTimeoutClose}
                    hasAccept = {InformationPromptInfo.hasAccept}
                    acceptButtonText = {InformationPromptInfo.acceptButtonText}
                    acceptPrimary = {InformationPromptInfo.acceptPrimary}
                    onAcceptPrompt = {InformationPromptInfo.onAcceptPrompt}
                />
                : null
            }
            {/* This is how to change the page from a single page application to a multipage application if needed. */}
            {props.page === "Page1" ? <Page1/> : null}
        </div>
    );
}

export default App;
