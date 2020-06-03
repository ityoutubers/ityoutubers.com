import React from 'react';

import { Header } from '../Header';
import { Main } from '../Main';

import './index.scss';

export const App: React.FC = () => {
    return (
        <div className="app">
            <Header />
            <Main />
        </div>
    );
};
