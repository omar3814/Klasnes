import React from 'react';
import { Student, Group } from '../../types';
import GroupGenerator from '../GroupGenerator';
import { useGroupGenerator } from '../../hooks/useGroupGenerator';

interface GroupsViewProps {
  students: Student[];
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  isGeneratingGroups: boolean;
  onGenerateGroups: (students: Student[], options: any) => Group[];
  onGenerateAIGroups: (prompt: string) => Promise<void>;
  onClearGroups: () => void;
}

const GroupsView: React.FC<GroupsViewProps> = (props) => {
   if (props.students.length === 0) {
      return (
         <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-foreground">Group Generator</h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Add students to your class to start creating groups.</p>
        </div>
      )
  }
  
  return (
    <div className="space-y-8">
      <GroupGenerator {...props} />
    </div>
  );
};

export default GroupsView;
