import React from 'react';
import { Desk, Student, SavedLayout } from '../../types';
import LayoutEditor from '../LayoutEditor';

interface LayoutViewProps {
  classroomId: string;
  students: Student[];
  layout: Desk[];
  savedLayouts: SavedLayout[];
  onUpdateLayout: (newLayout: Desk[]) => void;
  onSaveLayout: (classroomId: string, name: string, layout: Desk[]) => void;
  onDeleteLayout: (layoutId: string) => void;
}

const LayoutView: React.FC<LayoutViewProps> = (props) => {
   if (props.students.length === 0) {
      return (
         <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-foreground">Seating Layout</h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Add students to your class to design seating arrangements.</p>
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <LayoutEditor {...props} />
    </div>
  );
};

export default LayoutView;
