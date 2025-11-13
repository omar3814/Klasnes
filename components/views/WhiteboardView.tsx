import React from 'react';
import { WhiteboardSnapshot } from '../../types';
import Whiteboard from '../Whiteboard';

interface WhiteboardViewProps {
  classroomId: string | null;
  initialState: string | null;
  snapshots: WhiteboardSnapshot[];
  onSaveState: (state: string) => void;
  onSaveSnapshot: (classroomId: string, imageData: string, name: string) => void;
}

const WhiteboardView: React.FC<WhiteboardViewProps> = (props) => {
  if (!props.classroomId) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-foreground">Whiteboard</h1>
        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Please select a class to use the whiteboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Whiteboard {...props} />
    </div>
  );
};

export default WhiteboardView;
