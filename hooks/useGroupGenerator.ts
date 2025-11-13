

import { useState, useCallback, useEffect } from 'react';
import { Student, Group, GenerateOptions } from '../types.ts';

// Fisher-Yates shuffle algorithm
const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const createPairKey = (id1: string, id2: string): string => {
  return [id1, id2].sort().join('-');
};

export const useGroupGenerator = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [history, setHistory] = useState<Set<string>>(new Set());

  // This effect accumulates the history of all pairs that have been generated.
  // It's cleared only when the class changes (via clearGroups).
  useEffect(() => {
    setHistory(prevHistory => {
      const newHistory = new Set(prevHistory);
      groups.forEach(group => {
        for (let i = 0; i < group.students.length; i++) {
          for (let j = i + 1; j < group.students.length; j++) {
            newHistory.add(createPairKey(group.students[i].id, group.students[j].id));
          }
        }
      });
      return newHistory;
    });
  }, [groups]);

  const clearGroups = useCallback(() => {
    setGroups([]);
    setHistory(new Set()); // Also reset pairing history
  }, []);

  const generateGroups = useCallback((
    students: Student[],
    options: GenerateOptions
  ): Group[] => {
    if (options.type === 'existing') {
      setGroups(options.existingGroups);
      return options.existingGroups;
    }

    const { avoidPrevious } = options;
    let shuffledStudents = shuffle(students);
    
    if (avoidPrevious && history.size > 0) {
      let attempts = 0;
      const maxAttempts = 20; // Increased attempts for better chance of success
      let hasCollision = true;
      let collisionOnFinal = false;

      while (hasCollision && attempts < maxAttempts) {
        hasCollision = false;
        shuffledStudents = shuffle(students);
        
        const tempGroups = createGroups(shuffledStudents, options);
        for (const group of tempGroups) {
          for (let i = 0; i < group.students.length; i++) {
            for (let j = i + 1; j < group.students.length; j++) {
              const pairKey = createPairKey(group.students[i].id, group.students[j].id);
              if (history.has(pairKey)) {
                hasCollision = true;
                break;
              }
            }
            if (hasCollision) break;
          }
          if (hasCollision) break;
        }
        attempts++;
        if (hasCollision && attempts >= maxAttempts) {
          collisionOnFinal = true;
        }
      }
      
      if (collisionOnFinal) {
        // In a real app, we might show a toast notification here.
        console.warn(`Could not find a group combination without any previous pairs after ${maxAttempts} attempts. Some pairs may be repeated.`);
      }
    }

    const newGroups = createGroups(shuffledStudents, options);
    setGroups(newGroups);
    return newGroups;
  }, [history]);

  const createGroups = (
    students: Student[],
    options: GenerateOptions
  ): Group[] => {
    if (options.type === 'existing') return options.existingGroups;

    const numStudents = students.length;
    let numGroups = 0;

    if (options.value <= 0) {
      console.error("Group generation value must be positive.");
      return [];
    }

    switch (options.type) {
      case 'groupCount':
        numGroups = Math.min(options.value, numStudents);
        break;
      case 'studentCount':
        numGroups = Math.ceil(numStudents / options.value);
        break;
      case 'minStudentCount':
        numGroups = Math.floor(numStudents / options.value);
        break;
      case 'maxStudentCount':
        numGroups = Math.ceil(numStudents / options.value);
        break;
    }
    
    if(numGroups <= 0) return [];

    const newGroups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
      id: `group-${Date.now()}-${i}`,
      name: `Group ${i + 1}`,
      students: [],
    }));

    students.forEach((student, index) => {
      newGroups[index % numGroups].students.push(student);
    });
    
    return newGroups;
  };
  

  return { groups, setGroups, generateGroups, clearGroups, history };
};