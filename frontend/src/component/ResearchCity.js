import React, { useState } from 'react';
import commune from '../../src/maps/communes_codepostal.json';
import { AutoComplete } from 'antd';
import { CloseSquareFilled } from '@ant-design/icons';
import communeV2 from "../../src/maps/communes_codepostalV2.json";

const ResearchCity = ({ nameInput, onSelectValue }) => {

    const [options, setOptions] = useState([]);

    const onSelect = (data) => {
        onSelectValue(data);
    };

    const handleSearch = (searchText) => {
        const filteredCommunes = Object.entries(communeV2)
            .filter(([key]) =>
                key.toLowerCase().includes(searchText.toLowerCase())
            )
            .slice(0, 8)
            .map(([key, value]) => ({
                value: `${key}`
            }));

        setOptions(filteredCommunes);
    };

    return (
        <AutoComplete
            options={options}
            style={{ width: 240 }}
            onSelect={onSelect}
            onSearch={handleSearch}
            placeholder={nameInput}
            allowClear={{
                clearIcon: <CloseSquareFilled />,
            }}
        />
    );
};

export default ResearchCity;
