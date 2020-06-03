import { ETagGroup } from './enums';

// Админ
export interface IAdmin {
    telegramId: string;
};

// Тэг
export interface ITag {
    group: ETagGroup;
    value: string;
    displayValue: string;
};

// Канал
export interface IChannel {
    name: string;
    link: string;
    tags: ITag[];
};
