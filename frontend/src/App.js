import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartPage from './page/StartPage';
import ErrorPage from './page/ErrorPage';
import FloatButtonBackTop from './component/FloatButtonBackTop';
import TopBarStartPage from './component/TopBarStartPage';

import FooterGeneral from './component/FooterGeneral';
import Teammate from './page/Teammate';
import GoogleLoginButton from './authentification/GoogleLoginButton';
import Profile from './page/Profile';
import Maps from './component/Maps';
import ContainerMaps from './page/ContainerMaps';
import Register from './page/Register';
import AllTravel from './page/AllTravel';

const App = () => {

  const MapsContainer = () => {

    return (

      <>
        <Routes>
          <Route path="/" element={<Maps />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </>

    );
  };

  const HomeContainer = () => {

    return (

      <>
        <FloatButtonBackTop />
        <TopBarStartPage />
        <Routes>

          {localStorage.getItem('id') ? (
            <>
              <Route path="/" element={<StartPage />} />
              <Route path="/teammate" element={<Teammate />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<ErrorPage />} />
              <Route path='/register' element={<Register />} />
              <Route path='all-travel' element={<AllTravel />} />
            </>
          ) : (
            <>
              <Route path="/" element={<StartPage />} />
              <Route path="/teammate" element={<Teammate />} />
              <Route path="*" element={<ErrorPage />} />
              <Route path='/register' element={<Register />} />
              <Route path='all-travel' element={<AllTravel />} />
            </>
          )}
        </Routes>
        <FooterGeneral />
      </>
    );
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<HomeContainer />} />
          <Route path="*" element={<ErrorPage />} />
          <Route path='/maps/*' element={<MapsContainer />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;