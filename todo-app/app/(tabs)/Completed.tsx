import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  StatusBar,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: Date;
  priority: "low" | "medium" | "high";
}

const { width, height } = Dimensions.get("window");

export default function CompletedScreen() {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load completed tasks from storage and sort by priority
  const loadCompletedTasks = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem("tasks");
      if (tasksJson) {
        const allTasks: Task[] = JSON.parse(tasksJson).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
        const completed = allTasks.filter(task => task.done);
        
        // Sort by priority: high -> medium -> low
        const sortedTasks = completed.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        setCompletedTasks(sortedTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCompletedTasks();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCompletedTasks();
    setRefreshing(false);
  }, []);

  // Mark task as incomplete by clicking checkbox (moves back to home page)
  const markAsIncomplete = async (taskId: string) => {
    try {
      const tasksJson = await AsyncStorage.getItem("tasks");
      if (tasksJson) {
        const allTasks: Task[] = JSON.parse(tasksJson);
        const updatedTasks = allTasks.map(task =>
          task.id === taskId ? { ...task, done: false } : task
        );
        await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
        await loadCompletedTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to mark task as incomplete');
    }
  };

  // Delete task permanently
  const deleteTask = async (taskId: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task permanently?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const tasksJson = await AsyncStorage.getItem("tasks");
              if (tasksJson) {
                const allTasks: Task[] = JSON.parse(tasksJson);
                const updatedTasks = allTasks.filter(task => task.id !== taskId);
                await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
                await loadCompletedTasks();
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const showTaskOptions = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const clearAllCompleted = () => {
    if (completedTasks.length === 0) {
      Alert.alert("No completed tasks to clear");
      return;
    }

    Alert.alert(
      "Clear All Completed",
      `Delete all ${completedTasks.length} completed tasks?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            try {
              const tasksJson = await AsyncStorage.getItem("tasks");
              if (tasksJson) {
                const allTasks: Task[] = JSON.parse(tasksJson);
                const updatedTasks = allTasks.filter(task => !task.done);
                await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
                await loadCompletedTasks();
              }
            } catch (error) {
              console.error('Error clearing tasks:', error);
              Alert.alert('Error', 'Failed to clear completed tasks');
            }
          }
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return "🔥";
      case "medium": return "⚡";
      case "low": return "💧";
      default: return "⚡";
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        { borderLeftColor: getPriorityColor(item.priority) }
      ]}
      onLongPress={() => showTaskOptions(item)}
      delayLongPress={300}
    >
      <View style={styles.taskContent}>
        {/* Clickable checkbox to mark as incomplete */}
        <TouchableOpacity 
          style={[styles.checkbox, styles.checkboxDone]}
          onPress={() => markAsIncomplete(item.id)}
        >
          <Text style={styles.checkmark}>✓</Text>
        </TouchableOpacity>
        
        <View style={styles.taskTextContainer}>
          <Text style={styles.taskTextDone}>
            {item.text}
          </Text>
          <View style={styles.taskMeta}>
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityIcon}>
                {getPriorityIcon(item.priority)}
              </Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                <Text style={styles.priorityText}>{getPriorityLabel(item.priority)}</Text>
              </View>
            </View>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString()}
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1b23" />
      
      {/* Header with better spacing */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleIcon}>🏆</Text>
          <Text style={styles.title}>Completed Tasks</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
          </Text>
          {completedTasks.length > 0 && (
            <TouchableOpacity onPress={clearAllCompleted} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Task List with better spacing */}
      <FlatList
        data={completedTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={["#fff"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyStateText}>No completed tasks yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tasks you mark as complete will appear here
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          completedTasks.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerIcon}>🎯</Text>
              <Text style={styles.footerText}>
                {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
              </Text>
              <Text style={styles.footerSubtext}>
                Great job! Keep up the productivity
              </Text>
            </View>
          ) : null
        }
      />

      {/* Task Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Task Options</Text>
            {selectedTask && (
              <Text style={styles.modalTaskText}>"{selectedTask.text}"</Text>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.incompleteButton]}
                onPress={() => {
                  if (selectedTask) markAsIncomplete(selectedTask.id);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>↶ Mark Incomplete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={() => {
                  if (selectedTask) deleteTask(selectedTask.id);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>🗑️ Delete Task</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1b23",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2b33",
    backgroundColor: "#1a1b23",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsText: {
    fontSize: 16,
    color: "#888",
    fontWeight: "600",
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ff4757",
    borderRadius: 20,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  taskItem: {
    backgroundColor: "#252631",
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 16,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    backgroundColor: "#2ed573",
    borderColor: "#2ed573",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTextDone: {
    textDecorationLine: "line-through",
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    lineHeight: 22,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  dateText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
    borderRadius: 8,
  },
  deleteText: {
    color: "#ff4757",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.2,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  refreshButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: "#4834d4",
    borderRadius: 12,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  footerIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  footerSubtext: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#2a2b33",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalTaskText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  modalButtons: {
    width: "100%",
  },
  modalButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  incompleteButton: {
    backgroundColor: "#4834d4",
  },
  deleteModalButton: {
    backgroundColor: "#ff4757",
  },
  cancelButton: {
    backgroundColor: "#3a3b43",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});