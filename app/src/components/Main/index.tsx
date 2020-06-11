import React, { useState, useEffect } from 'react';

import { ITag, IChannel } from '../../models';
import { BASE_URL } from '../../consts';

import { Tags } from '../Tags';
import { Channels } from '../Channels';

export const Main: React.FC = () => {
    const [channels, setChannels] = useState<IChannel[]>([]);
    const [tags, setTags] = useState<ITag[]>([]);
    const [activeTags, setActiveTags] = useState<ITag[]>([]);

    useEffect(() => {
        fetch(`${BASE_URL}/channels`)
            .then(res => res.json())
            .then(setChannels)
    }, []);

    useEffect(() => {
        fetch(`${BASE_URL}/tags`)
            .then(res => res.json())
            .then(setTags)
    }, []);

    const filteredData = () => {
        return activeTags.reduce(function (sum, current) {
            return sum.filter((channel) => channel.tags.some(
                (tag) => tag.value === current.value && tag.group === current.group)
            );
          }, channels);
    };

    return (
        <div>
            <Tags
                tags={tags}
                activeTags={activeTags}
                onSetActiveTags={setActiveTags}
            />
            <Channels channels={activeTags.length ? filteredData() : channels} />
        </div>
    );
};
