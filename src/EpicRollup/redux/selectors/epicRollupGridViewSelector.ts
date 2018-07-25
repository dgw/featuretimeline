import { backlogConfigurationForProjectSelector } from '../modules/backlogconfiguration/backlogconfigurationselector';
import { teamIterationsSelector } from '../modules/teamIterations/teamIterationSelector';
import { workItemDisplayDetailsSelectors } from './workItemDisplayDetailsSelector';
import { IGridView, IWorkItemDisplayDetails, IIterationDisplayOptions, IGridItem, IGridWorkItem } from "../../../Common/redux/Contracts/GridViewContracts";
import { TeamSettingsIteration, BacklogConfiguration } from "TFS/Work/Contracts";
import { getDisplayIterations } from "../../../Common/redux/Selectors/displayIterationSelector";
import { workItemCompare } from "../../../FeatureTimeline/redux/selectors/workItemCompare";
import { CropWorkItem, UIStatus } from "../../../Common/redux/Contracts/types";
import { getProgress } from "../../../Common/redux/Helpers/ProgressHelpers";
import { getIterationDisplayDetails } from "../../../Common/redux/Helpers/getIterationDisplayDetails";
import { createSelector } from "reselect";
import { backogIterationsSelector } from '../modules/teamsettings/teamsettingsselector';
import { getIterationDisplayOptionsState } from '../../../Common/redux/modules/IterationDisplayOptions/iterationDisplayOptionsSelector';
import { getSettingsState } from '../../../Common/redux/modules/SettingsState/SettingsStateSelector';
import { ISettingsState, ProgressTrackingCriteria } from '../../../Common/redux/modules/SettingsState/SettingsStateContracts';
import { uiStateSelector } from './uiStateSelector';
import { getCurrentIterationIndex } from '../../../Common/redux/Helpers/iterationComparer';

export interface ITeamFieldDisplayItem extends IGridItem {
    teamField: string;
}

export interface IEpicRollupGridView extends IGridView {
    teamFieldDisplayItems: ITeamFieldDisplayItem[];
}

export const epicRollupGridViewSelector = createSelector(
    workItemDisplayDetailsSelectors,
    backogIterationsSelector as any,
    teamIterationsSelector as any,
    getIterationDisplayOptionsState as any,
    backlogConfigurationForProjectSelector,
    getSettingsState as any,
    uiStateSelector as any,
    getEpicRollupGridView,
);
export function getEpicRollupGridView(
    workItemDisplayDetails: IWorkItemDisplayDetails[],
    backlogIteration: TeamSettingsIteration,
    teamIterations: TeamSettingsIteration[],
    iterationDisplayOptions: IIterationDisplayOptions,
    backlogConfiguration: BacklogConfiguration,
    settingsState: ISettingsState,
    uiStatus: UIStatus
): IEpicRollupGridView {
    if (uiStatus !== UIStatus.Default) {
        return {
            teamFieldDisplayItems: [],
            workItems: [],
            isSubGrid: false,
            shadowForWorkItemId: 0,
            hideParents: false,
            iterationDisplayOptions,
            teamIterations: [],
            backlogIteration: null,
            emptyHeaderRow: [],
            iterationHeader: [],
            iterationShadow: [],
            currentIterationIndex: -1
        };
    }

    const {
        backlogFields: {
            typeFields
        }
    } = backlogConfiguration;

    const {
        progressTrackingCriteria
    } = settingsState;

    const teamFieldName = typeFields["Team"];

    const displayIterations: TeamSettingsIteration[] = getDisplayIterations(
        backlogIteration,
        teamIterations,
        workItemDisplayDetails,
        /* includeBacklogIteration */ true,
        iterationDisplayOptions);

    const { gridWorkItems, teamFieldDisplayItems } =
        getGridItems(
            workItemDisplayDetails,
            teamFieldName,
            displayIterations,
            iterationDisplayOptions,
            backlogIteration,
            settingsState,
            progressTrackingCriteria);

    const {
        emptyHeaderRow,
        iterationHeader,
        iterationShadow
    } = getIterationDisplayDetails(gridWorkItems, displayIterations, /*hideParents*/ false);

    const currentIterationIndex = getCurrentIterationIndex(teamIterations);
    return {
        workItems: gridWorkItems,
        teamFieldDisplayItems,
        isSubGrid: false,
        shadowForWorkItemId: -1,
        hideParents: false,
        iterationDisplayOptions,
        teamIterations,
        backlogIteration,
        iterationHeader,
        iterationShadow,
        emptyHeaderRow,
        currentIterationIndex
    }

}

function getGridItems(
    workItemDisplayDetails: IWorkItemDisplayDetails[],
    teamFieldName: string,
    displayIterations: TeamSettingsIteration[],
    iterationDisplayOptions: IIterationDisplayOptions,
    backlogIteration: TeamSettingsIteration,
    settingsState: ISettingsState,
    progressTrackingCriteria: ProgressTrackingCriteria): { gridWorkItems: IGridWorkItem[]; teamFieldDisplayItems: ITeamFieldDisplayItem[]; } {
    const workItemsByTeamField = getWorkItemsByTeamField(workItemDisplayDetails, teamFieldName);
    const sortedTeamFields = Object.keys(workItemsByTeamField).sort();
    const gridWorkItems: IGridWorkItem[] = [];
    const teamFieldDisplayItems: ITeamFieldDisplayItem[] = [];
    let teamGroupStartRow = 2;
    let teamGroupEndRow = -1;
    sortedTeamFields.forEach(teamField => {
        // create cards for work items, and only if there are more than one card for work items create card for the teamfield
        const orderedWorkItems = workItemsByTeamField[teamField].sort(workItemCompare);
        const workItemStartColumn = 2;
        let workItemStartRow = teamGroupStartRow;
        const childItems = orderedWorkItems.map(workItem => {
            const { iterationDuration: { startIteration, endIteration } } = workItem;
            let startIterationIndex = displayIterations.findIndex(di => di.id === startIteration.id);
            let endIterationIndex = displayIterations.findIndex(di => di.id === endIteration.id);
            let crop: CropWorkItem = CropWorkItem.None;
            let outofScope = false;
            if (iterationDisplayOptions) {
                if (startIterationIndex > iterationDisplayOptions.endIndex || endIterationIndex < iterationDisplayOptions.startIndex) {
                    outofScope = true;
                }
                if (iterationDisplayOptions.startIndex > startIterationIndex) {
                    startIterationIndex = 0;
                    crop = CropWorkItem.Left;
                }
                else {
                    startIterationIndex = displayIterations.findIndex(gi => gi.id === startIteration.id);
                }
                if (endIterationIndex > iterationDisplayOptions.endIndex) {
                    endIterationIndex = displayIterations.length - 1;
                    crop = crop === CropWorkItem.Left ? CropWorkItem.Both : CropWorkItem.Right;
                }
                else {
                    endIterationIndex = displayIterations.findIndex(gi => gi.id === endIteration.id);
                }
            }
            if (outofScope) {
                return null;
            }
            if (startIterationIndex < 0) {
                startIterationIndex = endIterationIndex = displayIterations.findIndex(i => i.id === backlogIteration.id);
            }
            const ret = {
                dimension: {
                    startRow: workItemStartRow,
                    endRow: workItemStartRow + 1,
                    startCol: workItemStartColumn + startIterationIndex,
                    endCol: workItemStartColumn + endIterationIndex
                },
                workItem,
                settingsState,
                isGap: false,
                progressIndicator: getProgress(workItem.children, progressTrackingCriteria),
                crop
            };
            workItemStartRow++;
            return ret;
        }).filter(x => !!x);
        if (childItems.length > 0) {
            gridWorkItems.push(...childItems);
            teamGroupEndRow = teamGroupStartRow + childItems.length;
            teamFieldDisplayItems.push({
                dimension: {
                    startRow: teamGroupStartRow,
                    startCol: 1,
                    endRow: teamGroupEndRow,
                    endCol: 2
                },
                teamField
            });
            teamGroupStartRow = teamGroupEndRow;
        }
    });
    return { gridWorkItems, teamFieldDisplayItems };
}

function getWorkItemsByTeamField(workItemDisplayDetails: IWorkItemDisplayDetails[], teamFieldName: string): IDictionaryStringTo<IWorkItemDisplayDetails[]> {
    const pathToLeaf = {};
    // get work items by leaf area path
    const workItemsByTeamField: IDictionaryStringTo<IWorkItemDisplayDetails[]> = workItemDisplayDetails.reduce((map, w) => {
        const areaPath: string = w.workItem.fields[teamFieldName];
        const parts = areaPath.split("/");
        let index = parts.length - 1;
        let leafValue = parts[index];
        // to check incase if the leaf value is duplicate, we keep track of entire path
        while (pathToLeaf[leafValue] && pathToLeaf[leafValue] !== areaPath) {
            index--;
            leafValue = `${parts[index]}/${leafValue}`;
        }
        pathToLeaf[leafValue] = areaPath;
        if (!map[leafValue]) {
            map[leafValue] = [];
        }
        map[leafValue].push(w);
        return map;
    }, {});
    return workItemsByTeamField;
}
