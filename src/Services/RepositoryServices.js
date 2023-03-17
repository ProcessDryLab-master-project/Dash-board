import axios from 'axios';

export async function PingRepository(hostname) {
    const urlExtension = "/Ping";
    return axios.get(`${hostname}${urlExtension}`);
}

export async function GetLogFilesMetadata(hostname){
    const urlExtension = "/resources/eventlogs";
    return axios.get(`${hostname}${urlExtension}`);
}

export async function GetVisFilesMetadata(hostname){
    const urlExtension = "/resources/visualizations";
    return axios.get(`${hostname}${urlExtension}`);
}

export async function GetFileImage(hostname, fileId){ //if the visualization is an image the reponseType needs to be blob
    const urlExtension = `Files/${fileId}`;
    return axios.get(`${hostname}${urlExtension}`, {responseType: 'blob'});
}

export async function GetFileText(hostname, fileId){ //If the visualization is text-formatted the responsetype can't be blolb
    const urlExtension = `Files/${fileId}`;
    return axios.get(`${hostname}${urlExtension}`);
}

export async function GetRepositoryConfig(hostname) {
    const urlExtension = "/configurations";
    return axios.get(`${hostname}${urlExtension}`);
}


export const sendFileToRepository = async (hostname, file, fileType, description = "") => {
    const urlExtension = "/resources";
    const fileExtension = file.name.split('.')[file.name.split('.').length - 1];
    const formdata = new FormData();
    formdata.append('file', file);
    formdata.append('ResourceLabel', file.name);
    formdata.append('ResourceType', fileType);
    formdata.append('FileExtension', fileExtension);
    formdata.append('Description', description);

    axios.post(`${hostname}${urlExtension}`, formdata);
};