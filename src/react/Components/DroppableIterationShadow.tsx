import { DropTarget } from 'react-dnd';
import { IIterationSahdowProps, IterationShadow } from './IterationShadow';
import React = require('react');
import { IWorkItemRendererProps } from './WorkItem/WorkItemRenderer';
import { IWorkItemListItemProps } from './WorkItem/WorkItemListItem';


export class DroppableIterationShadow extends React.Component<IIterationSahdowProps, {}> {
    public render() {
        return <IterationShadow {...this.props} />
    }
}


const iterationDropTarget = {
    canDrop(dropTargetProps: IIterationSahdowProps, monitor) {
        // let item = monitor.getItem() as IDraggableWorkItemRendererProps;
        // item = null;
        return true;
    },
    drop(dropTargetProps: IIterationSahdowProps, monitor, component) {
        if (monitor.didDrop()) {
            return;
        }

        let draggedItem = monitor.getItem();
        debugger;
        if (draggedItem["dimension"]) {
            const item = draggedItem as IWorkItemRendererProps;
            dropTargetProps.changeIteration(item.id, dropTargetProps.teamIteration, draggedItem.allowOverride);
        } else {
            const item = draggedItem as IWorkItemListItemProps;
            dropTargetProps.markInProgress(item.id, dropTargetProps.teamIteration, item.inProgressState);
        }

        return { moved: true };
    }
}

function collect(connect, monitor) {
    return {
        // Call this function inside render()
        // to let React DnD handle the drag events:
        connectDropTarget: connect.dropTarget(),
        // You can ask the monitor about the current drag state:
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
        itemType: monitor.getItemType()
    };
}

export const IterationDropTarget = DropTarget("WorkItem", iterationDropTarget, collect)(DroppableIterationShadow);