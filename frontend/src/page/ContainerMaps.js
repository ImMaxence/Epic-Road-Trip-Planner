import React from 'react';
import MenuMaps from '../component/MenuMaps';
import Maps from '../component/Maps';

const ContainerMaps = () => {
    return (
        <div className='flex_maps'>
            <MenuMaps />
            <Maps />
        </div>
    );
};

export default ContainerMaps;