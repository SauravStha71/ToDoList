import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  StatusBar,
  Dimensions,
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

const { width } = Dimensions.get("window");

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Load ALL tasks and filter only active ones
  const loadTasks = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem("tasks");
      if (tasksJson) {
        const allTasks: Task[] = JSON.parse(tasksJson).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
        
        // Filter only active (not completed) tasks
        const activeTasks = allTasks.filter(task => !task.done);
        
        // Sort by priority: high -> medium -> low
        const sortedTasks = activeTasks.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        setTasks(sortedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  // Refresh tasks when page comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = () => {
    if (input.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: input,
        done: false,
        createdAt: new Date(),
        priority
      };
      
      // Add new task and re-sort by priority
      const updatedTasks = [...tasks, newTask].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      setTasks(updatedTasks);
      saveTasksToStorage([...tasks, newTask]);
      setInput("");
      setPriority("medium");
    }
  };

  // Save tasks to AsyncStorage
  const saveTasksToStorage = async (tasksToSave: Task[]) => {
    try {
      // Get existing tasks first
      const existingTasksJson = await AsyncStorage.getItem("tasks");
      let allTasks: Task[] = [];
      
      if (existingTasksJson) {
        allTasks = JSON.parse(existingTasksJson).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
      }
      
      // Update or add tasks
      tasksToSave.forEach(task => {
        const existingIndex = allTasks.findIndex(t => t.id === task.id);
        if (existingIndex >= 0) {
          allTasks[existingIndex] = task;
        } else {
          allTasks.push(task);
        }
      });
      
      await AsyncStorage.setItem("tasks", JSON.stringify(allTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const toggleTask = async (id: string) => {
    // Find the task to mark as completed
    const taskToComplete = tasks.find(t => t.id === id);
    if (taskToComplete) {
      // Mark task as completed
      const completedTask = { ...taskToComplete, done: true };
      
      // Remove from current view (homepage)
      const updatedTasks = tasks.filter(t => t.id !== id);
      
      // Re-sort remaining tasks
      const sortedTasks = updatedTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      setTasks(sortedTasks);
      
      // Save the completed task to storage
      const existingTasksJson = await AsyncStorage.getItem("tasks");
      let allTasks: Task[] = [];
      
      if (existingTasksJson) {
        allTasks = JSON.parse(existingTasksJson).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
      }
      
      // Update the task in storage to mark it as completed
      const updatedAllTasks = allTasks.map(task => 
        task.id === id ? completedTask : task
      );
      
      await AsyncStorage.setItem("tasks", JSON.stringify(updatedAllTasks));
    }
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
          onPress: async () => {
            const updatedTasks = tasks.filter(t => t.id !== id);
            // Re-sort after deletion
            const sortedTasks = updatedTasks.sort((a, b) => {
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
            setTasks(sortedTasks);
            
            // Also remove from storage
            const existingTasksJson = await AsyncStorage.getItem("tasks");
            if (existingTasksJson) {
              const allTasks: Task[] = JSON.parse(existingTasksJson);
              const updatedAllTasks = allTasks.filter(task => task.id !== id);
              await AsyncStorage.setItem("tasks", JSON.stringify(updatedAllTasks));
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

  const editTask = (task: Task) => {
    setEditingTask(task);
    setEditText(task.text);
    setEditPriority(task.priority);
    setEditModalVisible(true);
  };

  const saveEditedTask = async () => {
    if (editText.trim() && editingTask) {
      const updatedTasks = tasks.map(task =>
        task.id === editingTask.id
          ? { ...task, text: editText.trim(), priority: editPriority }
          : task
      );
      
      // Re-sort after editing
      const sortedTasks = updatedTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      setTasks(sortedTasks);
      
      // Save to storage
      await saveTasksToStorage(sortedTasks);
      
      setEditModalVisible(false);
      setEditingTask(null);
      setEditText("");
    }
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

  const totalCount = tasks.length;

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
        {/* Empty checkbox - becomes checked when pressed */}
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => toggleTask(item.id)}
        >
          {/* Checkmark only appears when task is done, but in homepage they're all not done */}
        </TouchableOpacity>
        <View style={styles.taskTextContainer}>
          <Text style={styles.taskText}>
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
              {item.createdAt.toLocaleDateString()}
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
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleIcon}>📝</Text>
          <Text style={styles.title}>Todo Master</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {totalCount} task{totalCount !== 1 ? 's' : ''} remaining
          </Text>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <TextInput
          placeholder="What needs to be done?"
          placeholderTextColor="#666"
          value={input}
          onChangeText={setInput}
          style={styles.input}
          onSubmitEditing={addTask}
        />
        
        <View style={styles.prioritySelector}>
          {(["low", "medium", "high"] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.priorityOption,
                priority === level && { backgroundColor: getPriorityColor(level) }
              ]}
              onPress={() => setPriority(level)}
            >
              <Text style={[
                styles.priorityOptionText,
                priority === level && styles.priorityOptionTextActive
              ]}>
                {getPriorityLabel(level)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.addButton, !input.trim() && styles.addButtonDisabled]} 
          onPress={addTask}
          disabled={!input.trim()}
        >
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyStateText}>No tasks yet</Text>
            <Text style={styles.emptyStateSubtext}>Add a task above to get started!</Text>
          </View>
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
                style={[styles.modalButton, styles.editButton]}
                onPress={() => {
                  if (selectedTask) editTask(selectedTask);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Edit Task</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.toggleButton]}
                onPress={() => {
                  if (selectedTask) toggleTask(selectedTask.id);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Mark Complete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={() => {
                  if (selectedTask) deleteTask(selectedTask.id);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Delete Task</Text>
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

      {/* Edit Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Task</Text>
            
            <TextInput
              placeholder="Edit your task..."
              placeholderTextColor="#666"
              value={editText}
              onChangeText={setEditText}
              style={styles.input}
              multiline
            />
            
            <View style={styles.prioritySelector}>
              {(["low", "medium", "high"] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.priorityOption,
                    editPriority === level && { backgroundColor: getPriorityColor(level) }
                  ]}
                  onPress={() => setEditPriority(level)}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    editPriority === level && styles.priorityOptionTextActive
                  ]}>
                    {getPriorityLabel(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEditedTask}
                disabled={!editText.trim()}
              >
                <Text style={styles.modalButtonText}>Save Changes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingTask(null);
                  setEditText("");
                }}
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
    paddingTop: 60,
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
  inputSection: {
    padding: 20,
    backgroundColor: "#1a1b23",
  },
  input: {
    backgroundColor: "#2a2b33",
    color: "#ffffff",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#3a3b43",
  },
  prioritySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  priorityOption: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#2a2b33",
    borderWidth: 1,
    borderColor: "#3a3b43",
  },
  priorityOptionText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  priorityOptionTextActive: {
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#4834d4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#2a2b33",
    opacity: 0.5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
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
    backgroundColor: "#2a2b33",
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
    borderColor: "#4834d4",
    marginRight: 16,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2b33",
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    color: "#fff",
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
    paddingVertical: 100,
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
  toggleButton: {
    backgroundColor: "#4834d4",
  },
  editButton: {
    backgroundColor: "#3498db",
  },
  saveButton: {
    backgroundColor: "#27ae60",
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