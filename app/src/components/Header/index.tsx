import React, { useEffect, useState } from "react";

import { IAdmin } from '../../models';
import { BASE_URL } from '../../consts';

import './index.scss';

export const Header: React.FC = () => {
    const [items, setItems] = useState<IAdmin[]>([]);
    let result = null;

    useEffect(() => {
        fetch(`${BASE_URL}/admins`)
            .then(res => res.json())
            .then(setItems)
    }, []);

    if (items && items.length) {
        result = items.map((admin, index) => (
            <React.Fragment key={admin.telegramId}>
                <a
                    href={`https://tmtr.me/${admin.telegramId}`}
                    target="_blank"
                    className="link-admin"
                    rel="noopener noreferrer"
                >
                    {`@${admin.telegramId}`}
                </a>
                {index + 1 === items.length ? '' : ', '}
            </React.Fragment>
        ));
    } else {
        result = <div>Загрузка...</div>;
    }

    return (
        <div className="app-header">
            <div className="app-header__col-left">
                <h1>#ITYouTubersRu</h1>
                <h2>Сообщество русскоязычных IT-ютуберов</h2>
            </div>

            <div className="app-header__col-right">
                По вопросам вступления обращайтесь в телеграм:<br />
                {result}
            </div>
        </div>
    );
};
