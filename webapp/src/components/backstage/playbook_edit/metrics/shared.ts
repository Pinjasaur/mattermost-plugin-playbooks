// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Duration} from 'luxon';
import styled from 'styled-components';

import {MetricType} from 'src/types/playbook';

export const targetToString = (target: number, type: MetricType) => {
    if (!target) {
        if (type === MetricType.Integer || type === MetricType.Currency) {
            return '0';
        }
        return '00:00:00';
    }

    if (type === MetricType.Integer || type === MetricType.Currency) {
        return target.toString();
    }

    const dur = Duration.fromMillis(target).shiftTo('days', 'hours', 'minutes');
    const dd = dur.days.toString().padStart(2, '0');
    const hh = dur.hours.toString().padStart(2, '0');
    const mm = dur.minutes.toString().padStart(2, '0');
    return `${dd}:${hh}:${mm}`;
};

export const stringToTarget = (target: string, type: MetricType) => {
    if (target === '') {
        return 0;
    }

    if (type === MetricType.Integer || type === MetricType.Currency) {
        return parseInt(target, 10);
    }

    // assuming we've verified this is a duration in the format dd:mm:ss
    const ddmmss = target.split(':').map((c) => parseInt(c, 10));
    return Duration.fromObject({
        days: ddmmss[0],
        hours: ddmmss[1],
        minutes: ddmmss[2],
    }).as('milliseconds');
};

export const Rhs = styled.div`
  font-size: 18px;
  color: rgba(var(--center-channel-color-rgb), 0.56);
`;

export const Button = styled.button`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: 4px 1px;
    background: none;
    border-radius: 4px;
    border: 0;

    :hover {
        background: rgba(var(--center-channel-color-rgb), 0.08);
    }
`;
