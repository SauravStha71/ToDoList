import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SectionList,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: Date;
  dueDate: Date;
  priority: "low" | "medium" | "high";
}

interface Section {
  title: string;
  data: Task[];
}

const { width } = Dimensions.get("window");

export default function AllTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    const saved = await AsyncStorage.getItem("tasks");
    if (saved) {
      const parsedTasks = JSON.parse(saved);
      
      // Filter out invalid dates (December 31, 1969)
      const validTasks = parsedTasks.filter((task: any) => {
        const dueDate = new Date(task.dueDate);
        // Filter out the epoch date (December 31, 1969)
        return dueDate.getFullYear() > 1970;
      });
      
      setTasks(validTasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        dueDate: new Date(task.dueDate)
      })));
    }
  };

  // Filter out today's tasks and group by date
  const getOtherTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const otherTasks = tasks.filter(task => {
      const taskDueDate = new Date(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0);
      
      // Filter out invalid dates AND today's tasks
      return taskDueDate.getFullYear() > 1970 && taskDueDate.getTime() !== today.getTime();
    });

    // Group tasks by date
    const groupedTasks: { [key: string]: Task[] } = {};
    
    otherTasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const dateKey = dueDate.toISOString().split('T')[0];
      
      if (!groupedTasks[dateKey]) {
        groupedTasks[dateKey] = [];
      }
      groupedTasks[dateKey].push(task);
    });

    // Convert to sections and sort by date
    const sections: Section[] = Object.keys(groupedTasks)
      .sort()
      .map(dateKey => {
        const date = new Date(dateKey);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let title = "";
        if (date.getTime() === today.getTime()) {
          title = "Today";
        } else if (date.getTime() === tomorrow.getTime()) {
          title = "Tomorrow";
        } else {
          title = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
          });
        }

        // Sort tasks by priority and completion status
        const sortedTasks = groupedTasks[dateKey].sort((a, b) => {
          // Sort by completion status first (incomplete first)
          if (a.done !== b.done) {
            return a.done ? 1 : -1;
          }
          // Then by priority (high to low)
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        return {
          title,
          data: sortedTasks
        };
      });

    return sections;
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => setTasks(tasks.filter(t => t.id !== id))
        }
      ]
    );
  };

  const clearAllCompleted = () => {
    const completedTasks = tasks.filter(t => t.done);
    if (completedTasks.length === 0) {
      Alert.alert("No completed tasks to clear");
      return;
    }

    Alert.alert(
      "Clear All Completed",
      `Delete ${completedTasks.length} completed task${completedTasks.length > 1 ? 's' : ''}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: () => setTasks(tasks.filter(t => !t.done))
        }
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "#ff4757";
      case "medium": return "#ffa502";
      case "low": return "#2ed573";
      default: return "#57606f";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "High";
      case "medium": return "Medium";
      case "low": return "Low";
      default: return "Medium";
    }
  };

  const isOverdue = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    return taskDueDate < today;
  };

  const getTaskStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingTasks = tasks.filter(t => {
      const taskDueDate = new Date(t.dueDate);
      taskDueDate.setHours(0, 0, 0, 0);
      return !t.done && taskDueDate > today;
    }).length;

    return { totalTasks, completedTasks, upcomingTasks };
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        item.done && styles.taskItemDone,
        { borderLeftColor: getPriorityColor(item.priority) }
      ]}
      onPress={() => toggleTask(item.id)}
    >
      <View style={styles.taskContent}>
        <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
          {item.done && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.taskTextContainer}>
          <Text style={[styles.taskText, item.done && styles.taskTextDone]}>
            {item.text}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{getPriorityLabel(item.priority)}</Text>
            </View>
            <Text style={[
              styles.dateText,
              isOverdue(item.dueDate) && !item.done && styles.overdueText
            ]}>
              {isOverdue(item.dueDate) && !item.done ? "Overdue " : ""}
              {new Date(item.dueDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => deleteTask(item.id)}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} tasks</Text>
    </View>
  );

  const stats = getTaskStats();
  const sections = getOtherTasks();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1b23" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📋 All Tasks</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalTasks}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completedTasks}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.upcomingTasks}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>
        {stats.completedTasks > 0 && (
          <TouchableOpacity onPress={clearAllCompleted} style={styles.clearAllButton}>
            <Text style={styles.clearAllButtonText}>Clear Completed</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Task List */}
      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          renderSectionHeader={renderSectionHeader}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No upcoming tasks</Text>
          <Text style={styles.emptyStateSubtext}>
            {tasks.length === 0 
              ? "All your tasks will appear here" 
              : "All your tasks are scheduled for today"
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1b23",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2b33",
    backgroundColor: "#1a1b23",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  clearAllButton: {
    backgroundColor: "#ff4757",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: "center",
  },
  clearAllButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2b33",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  sectionCount: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  taskItem: {
    backgroundColor: "#2a2b33",
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4834d4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskItemDone: {
    opacity: 0.7,
    backgroundColor: "#252631",
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#4834d4",
    marginRight: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    backgroundColor: "#4834d4",
    borderColor: "#4834d4",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  taskTextDone: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priorityText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  dateText: {
    color: "#666",
    fontSize: 11,
  },
  overdueText: {
    color: "#ff4757",
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  deleteText: {
    color: "#ff4757",
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});