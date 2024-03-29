import './Dropdown.scss';
import Select from 'react-select'

function Dropdown(props) {

    const {
        options,
        label,
        placeholder = "select from list",
        onValueChange = () => {},
        value = null,
        loading = false,
        extraParam = null,
        labelPosition = "top",
    } = props;
    
    const handleValueChange = (value) => {
        if(extraParam != null) onValueChange(value, extraParam);
        else onValueChange(value);
    }

    if(loading){
        return <div>... loading</div>
    }

    const colourStyles = {
        menuList: (styles) => {
            return {
                ...styles,
                flexWrap: "nowrap", 
                whiteSpace: "nowrap", 
                width: "inherit",
                textOverflow: 'ellipsis',
                overflowX: "hidden",
            };
        },
        valueContainer: (styles) => {
            return {
                ...styles,
                flexWrap: "nowrap", 
                whiteSpace: "nowrap", 
                width: "inherit",
                textOverflow: 'ellipsis',
                overflowX: "hidden",
            };
        },
    };

    return (
        <div className={`Dropdown-container Dropdown-container-${labelPosition}`}>
            <span className={`Dropdown-label Dropdown-label-${labelPosition}`}>{label}</span>
            <div className='Dropdown' onClick={(e) => {e.stopPropagation()}}>
                <Select 
                    options={options} 
                    value={value} 
                    onChange={handleValueChange} 
                    name="Dropdown" 
                    search={true} 
                    placeholder={placeholder} 
                    onClick={(e) => {e.stopPropagation()}}
                    onMouseDown={(e) => e.stopPropagation()}
                    onValueClick={(e) => {e.stopPropagation()}}
                    styles = {colourStyles}
                />
            </div>
        </div>
    );
}

export default Dropdown;
