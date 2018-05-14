import { ActionCreator } from 'redux';
import { InitializeAction, InitializeType, ShowDetailsAction, 
    ShowDetailsType, CloseDetailsAction, CloseDetailsType, 
    ResetAction, ResetType, 
    ToggleProposedWorkItemsPaneAction, ToggleProposedWorkItemsPaneType } from './actions';

export const resetAllData: ActionCreator<ResetAction> = () => ({
    type: ResetType,
    payload: null
});

export const createInitialize: ActionCreator<InitializeAction> =
    (projectId: string, teamId: string, backlogLevelName: string) => ({
        type: InitializeType,
        payload: {
            projectId,
            teamId,
            backlogLevelName
        }
    });

export const showDetails: ActionCreator<ShowDetailsAction> =
    (id: number) => ({
        type: ShowDetailsType,
        payload: { id }
    });


export const closeDetails: ActionCreator<CloseDetailsAction> =
    (id: number) => ({
        type: CloseDetailsType,
        payload: { id }
    });

export const toggleProposedWorkItemsPane: ActionCreator<ToggleProposedWorkItemsPaneAction> = () => ({
    type: ToggleProposedWorkItemsPaneType,
    payload: null
}) 