import './HistogramVisualizer.scss';
import {useState, useEffect, useCallback} from 'react';
import { Chart } from "react-google-charts";
import {GetHistogramOfLog} from '../../../Services/RepositoryServices';
import { getFileResourceLabel, getFileResourceId, getFileRepositoryUrl, getFileContent, getFileDynamic, getFileExtension } from '../../../Utils/FileUnpackHelper';
import LoadingSpinner from '../../Widgets/LoadingSpinner/LoadingSpinner';

function HistogramVisualizer(props) {
    const {
        file,
    } = props;

    const [isLoading, setIsLoading] = useState(true);
    const [fileContent, setFileContent] = useState([]);
    const [error, setError] = useState(null);

    const [, updateState] = useState();
    const forceUpdate = useCallback(() =>{ 
        updateState({}); 
    }, []);

    useEffect(() => {
        if(getFileDynamic(file) || (getFileExtension(file) && getFileExtension(file).toUpperCase() === "JSON")){
            setFileContent(convertFileContentToHistogramData(getFileContent(file)));
            forceUpdate();
            setIsLoading(false);
        }
        else if(file && !getFileDynamic(file) && !getFileContent(file) && getFileExtension(file)){
            setHistogramOfLog();
        }
        else {
            setFileContent(convertFileContentToHistogramData(getFileContent(file)));
            setIsLoading(false);
        }
    }, [file]);

    const setHistogramOfLog = async () => {
        GetHistogramOfLog(getFileRepositoryUrl(file), getFileResourceId(file))
            .then((res) => {
                setFileContent(convertFileContentToHistogramData(res.data));
                setIsLoading(false);
            })
            .catch((err) => { 
                setError(err); 
                setIsLoading(false);
            })
    }

    const convertFileContentToHistogramData = (fileContent) => {
        let data = [["Events", "Event"]]; // Add header - always the first index in the top-level array
        return data.concat(fileContent);
    }

    if(isLoading){
        return (
            <div className="HistogramVisualizer">
                <div className='Spinner-container-l'>
                    <LoadingSpinner loading={isLoading}/>
                </div>
            </div>
        )
    }

    if(error){
        const errorStatusText = error?.response?.statusText;
        const errorStatusCode = error?.response?.status;
        const errorStatusData = error?.response?.data;
        return (
            <div className="ResourceGraph">
                <div>Error loading histogram</div>
                <div>{`${errorStatusText ? errorStatusText : "Unexpected problem occured while trying to get resource."} 
                    Status code: ${errorStatusCode ? errorStatusCode : "unknown"}`}</div>
            </div>
        )
    }

    const convertFileToHistogramOptions = (file) => {
        return {chart: {
            title: `${getFileResourceLabel(file)}`,
            subtitle: "Occurances of events",
        }}
    }

    return (
        <div className="HistogramVisualizer">
            <Chart
                chartType="Bar"
                width="100%"
                height="500px"
                data={fileContent}
                options={convertFileToHistogramOptions(file)}
            />
        </div>
    )
}

export default HistogramVisualizer;
