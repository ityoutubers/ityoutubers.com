import React from 'react';
import classnames from 'classnames';

import { ITag } from '../../models';
import { ETagGroup } from '../../enums';

import './index.scss';

interface IProps {
    tags: ITag[];
    activeTags: ITag[];
    onSetActiveTags: (tags: ITag[]) => void;
}

export const Tags: React.FC<IProps> = ({ tags, activeTags, onSetActiveTags }) => {
    const frontendTags: React.ReactNode[] = [];
    const backendTags: React.ReactNode[] = [];
    const designTags: React.ReactNode[] = [];
    const commonTags: React.ReactNode[] = [];

    const tagItem = (tag: ITag) => {
        const active = activeTags.indexOf(tag) > -1;
        const onTagClick = () => {
            if (active) {
                const newValue = activeTags.filter((item) => item.value !== tag.value);
                onSetActiveTags(newValue);
            } else {
                onSetActiveTags([...activeTags, tag]);
            }
        };

        return (
            <div className="tag-item" key={tag.value}>
                <button
                    className={classnames('tag-item__button', { 'tag-item__button--active': active })}
                    onClick={onTagClick}
                >
                    {tag.displayValue}
                </button>
            </div>
        );
    };

    tags.forEach((tag: ITag) => {
        switch (tag.group) {
            case ETagGroup.FRONTEND:
                frontendTags.push(tagItem(tag));
                break;
            case ETagGroup.BACKEND:
                backendTags.push(tagItem(tag));
                break;
            case ETagGroup.DESIGN:
                designTags.push(tagItem(tag));
                break;
            case ETagGroup.COMMON:
                commonTags.push(tagItem(tag));
                break;
        }
    });

    return (
        <div className="tags-list">
            <div className="tags-list__group">
                <div className="tags-list__group-title">Frontend</div>
                <div className="tags-list__group-content">{frontendTags}</div>
            </div>
            <div className="tags-list__group">
                <div className="tags-list__group-title">Backend</div>
                <div className="tags-list__group-content">{backendTags}</div>
            </div>
            <div className="tags-list__group">
                <div className="tags-list__group-title">Дизайн</div>
                <div className="tags-list__group-content">{designTags}</div>
            </div>
            <div className="tags-list__group">
                <div className="tags-list__group-title">Общие</div>
                <div className="tags-list__group-content">{commonTags}</div>
            </div>
        </div>
    );
}