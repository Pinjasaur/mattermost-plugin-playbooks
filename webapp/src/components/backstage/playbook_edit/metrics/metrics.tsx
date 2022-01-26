// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode, useState} from 'react';
import styled from 'styled-components';
import {useIntl} from 'react-intl';

import {TertiaryButton} from 'src/components/assets/buttons';
import DotMenu, {DropdownMenuItem} from 'src/components/dot_menu';
import {DraftPlaybookWithChecklist, Metric, MetricType, newMetric, PlaybookWithChecklist} from 'src/types/playbook';
import MetricEdit from 'src/components/backstage/playbook_edit/metrics/metric_edit';
import MetricView from 'src/components/backstage/playbook_edit/metrics/metric_view';
import {DollarSign, PoundSign} from 'src/components/backstage/playbook_edit/styles';
import ConfirmModalLight from 'src/components/widgets/confirmation_modal_light';
import {Rhs, Button} from 'src/components/backstage/playbook_edit/metrics/shared';

enum TaskType {
    add,
    edit,
    delete,
}

interface Task {
    type: TaskType;
    addType?: MetricType;
    index?: number;
}

interface Props {
    playbook: DraftPlaybookWithChecklist | PlaybookWithChecklist;
    setPlaybook: React.Dispatch<React.SetStateAction<DraftPlaybookWithChecklist | PlaybookWithChecklist>>;
    setChangesMade: (b: boolean) => void;
}

const Metrics = ({playbook, setPlaybook, setChangesMade}: Props) => {
    const {formatMessage} = useIntl();
    const [curEditingIdx, setCurEditingIdx] = useState(-1);
    const [saveMetricToggle, setSaveMetricToggle] = useState(false);
    const [nextTask, setNextTask] = useState<Task | null>(null);
    const [deletingIdx, setDeletingIdx] = useState(-1);

    const deleteMessage = formatMessage({defaultMessage: 'If you delete this metric, the values for it will not be collected for any future runs.'});
    const deleteExistingMessage = deleteMessage + ' ' + formatMessage({defaultMessage: 'You will still be able to access historical data for this metric.'});

    const requestAddMetric = (addType: MetricType) => {
        // Only add a new metric if we aren't currently editing.
        if (curEditingIdx === -1) {
            addMetric(addType);
            return;
        }

        // We're editing. Try to close it, and if successful add the new metric.
        setNextTask({type: TaskType.add, addType});
        setSaveMetricToggle((prevState) => !prevState);
    };

    const requestEditMetric = (idx: number) => {
        // Edit a metric immediately if we aren't currently editing.
        if (curEditingIdx === -1) {
            setCurEditingIdx(idx);
            return;
        }

        // We're editing. Try to close it, and if successful edit the metric.
        setNextTask({type: TaskType.edit, index: idx});
        setSaveMetricToggle((prevState) => !prevState);
    };

    const requestDeleteMetric = (idx: number) => {
        // Confirm delete immediately if we aren't currently editing, or editing the requested idx.
        if (curEditingIdx === -1 || curEditingIdx === idx) {
            setDeletingIdx(idx);
            return;
        }

        // We're editing. Try to close it, and if successful delete the metric.
        setNextTask({type: TaskType.delete, index: idx});
        setSaveMetricToggle((prevState) => !prevState);
    };

    const addMetric = (metricType?: MetricType) => {
        const addType = metricType || nextTask?.addType;

        if (!addType) {
            return;
        }

        const newIdx = playbook.metrics.length;
        setPlaybook((pb) => ({
            ...pb,
            metrics: [...pb.metrics, newMetric(addType)],
        }));
        setChangesMade(true);
        setCurEditingIdx(newIdx);
    };

    const saveMetric = (metric: Metric, idx: number) => {
        setPlaybook((pb) => {
            const metrics = [...pb.metrics];
            metrics.splice(idx, 1, metric);

            return {
                ...pb,
                metrics,
            };
        });
        setChangesMade(true);
        setCurEditingIdx(-1);

        // Do we have a requested task ready to do next?
        if (nextTask?.type === TaskType.add) {
            setNextTask(null);
            addMetric();
        } else if (nextTask?.type === TaskType.edit) {
            setNextTask(null);

            // The following is because if editIndex === 0, 0 is falsey
            // eslint-disable-next-line no-undefined
            const index = nextTask.index === undefined ? -1 : nextTask.index;
            setCurEditingIdx(index);
        } else if (nextTask?.type === TaskType.delete) {
            setNextTask(null);

            // The following is because if editIndex === 0, 0 is falsey
            // eslint-disable-next-line no-undefined
            const index = nextTask.index === undefined ? -1 : nextTask.index;
            setDeletingIdx(index);
        }
    };

    const confirmedDelete = () => {
        setPlaybook((pb) => {
            const metrics = [...pb.metrics];
            metrics.splice(deletingIdx, 1);

            return {
                ...pb,
                metrics,
            };
        });
        setChangesMade(true);
        setDeletingIdx(-1);
    };

    return (
        <div>
            {
                playbook.metrics.map((metric, idx) => (
                    <DeleteWrapper
                        key={idx}
                        deleteClick={() => requestDeleteMetric(idx)}
                    >
                        {
                            idx === curEditingIdx ?
                                <MetricEdit
                                    metric={metric}
                                    otherTitles={playbook.metrics.flatMap((m, i) => (i === idx ? [] : m.title))}
                                    onAdd={(m) => saveMetric(m, idx)}
                                    saveToggle={saveMetricToggle}
                                    saveFailed={() => setNextTask(null)}
                                /> :
                                <MetricView
                                    metric={metric}
                                    editClick={() => requestEditMetric(idx)}
                                />
                        }
                    </DeleteWrapper>
                ))
            }
            <DotMenu
                dotMenuButton={TertiaryButton}
                icon={
                    <>
                        <i className='icon-plus'/>
                        {formatMessage({defaultMessage: 'Add Metric'})}
                    </>
                }
                disabled={playbook.metrics.length >= 4}
                topPx={-170}
                leftPx={20}
            >
                <DropdownMenuItem onClick={() => requestAddMetric(MetricType.Duration)}>
                    <MetricTypeOption
                        icon={<i className='icon-clock-outline'/>}
                        title={formatMessage({defaultMessage: 'Duration (in dd:hh:mm)'})}
                        description={formatMessage({defaultMessage: 'e.g., Time to acknowledge, Time to resolve'})}
                    />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => requestAddMetric(MetricType.Currency)}>
                    <MetricTypeOption
                        icon={<DollarSign size={1.2}/>}
                        title={formatMessage({defaultMessage: 'Dollars'})}
                        description={formatMessage({defaultMessage: 'e.g., Cost, Purchases'})}
                    />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => requestAddMetric(MetricType.Integer)}>
                    <MetricTypeOption
                        icon={<PoundSign size={1.2}/>}
                        title={formatMessage({defaultMessage: 'Integer'})}
                        description={formatMessage({defaultMessage: 'e.g., Resource count, Customers affected'})}
                    />
                </DropdownMenuItem>
            </DotMenu>
            <ConfirmModalLight
                show={deletingIdx >= 0}
                title={formatMessage({defaultMessage: 'Are you sure you want to delete?'})}
                message={deletingIdx >= 0 && playbook.metrics[deletingIdx].id === '' ? deleteMessage : deleteExistingMessage}
                confirmButtonText={formatMessage({defaultMessage: 'Delete metric'})}
                onConfirm={confirmedDelete}
                onCancel={() => setDeletingIdx(-1)}
            />
        </div>
    );
};

const DeleteWrapper = ({children, deleteClick}: { children: ReactNode, deleteClick: () => void }) => (
    <DeleteContainer>
        {children}
        <Rhs>
            <StyledButton
                data-testid={'delete-metric'}
                onClick={deleteClick}
            >
                <i className={'icon-trash-can-outline'}/>
            </StyledButton>
        </Rhs>
    </DeleteContainer>
);

const DeleteContainer = styled.div`
    display: flex;
`;

const StyledButton = styled(Button)`
    margin-left: 2px;
`;

interface MetricTypeProps {
    icon: JSX.Element;
    title: string;
    description: string;
}

const MetricTypeOption = ({icon, title, description}: MetricTypeProps) => (
    <HorizontalContainer>
        {icon}
        <VerticalContainer>
            <OptionTitle>{title}</OptionTitle>
            <OptionDesc>{description}</OptionDesc>
        </VerticalContainer>
    </HorizontalContainer>
);

const HorizontalContainer = styled.div`
    display: flex;
    align-items: start;

    > i {
        color: rgba(var(--center-channel-color-rgb), 0.56);
        margin-top: 2px;
    }

    > svg {
        color: rgba(var(--center-channel-color-rgb), 0.56);
        margin: 2px 7px 0 0;
    }
`;

const VerticalContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const OptionTitle = styled.div`
    font-size: 14px;
    line-height: 20px;
`;

const OptionDesc = styled.div`
    font-size: 12px;
    line-height: 16px;
    color: rgba(var(--center-channel-color-rgb), 0.56);
`;

export default Metrics;
