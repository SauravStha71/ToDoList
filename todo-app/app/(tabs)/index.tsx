import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const loadTasks = async () => {
      const saved = await AsyncStorage.getItem("tasks");
      if (saved) {
        const parsedTasks = JSON.parse(saved);
        setTasks(parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        })));
      }
    };
    loadTasks();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (input.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: input,
        done: false,
        createdAt: new Date(),
        priority
      };
      setTasks([...tasks, newTask]);
      setInput("");
      setPriority("medium");
    }
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

  const saveEditedTask = () => {
    if (editText.trim() && editingTask) {
      setTasks(tasks.map(task =>
        task.id === editingTask.id
          ? { ...task, text: editText.trim(), priority: editPriority }
          : task
      ));
      setEditModalVisible(false);
      setEditingTask(null);
      setEditText("");
    }
  };

  const clearCompleted = () => {
    const completedTasks = tasks.filter(t => t.done);
    if (completedTasks.length === 0) {
      Alert.alert("No completed tasks to clear");
      return;
    }

    Alert.alert(
      "Clear Completed",
      `Delete ${completedTasks.length} completed task${completedTasks.length > 1 ? 's' : ''}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
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

  const completedCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        item.done && styles.taskItemDone,
        { borderLeftColor: getPriorityColor(item.priority) }
      ]}
      onPress={() => toggleTask(item.id)}
      onLongPress={() => showTaskOptions(item)}
      delayLongPress={300}
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
            <Text style={styles.dateText}>
              {item.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Delete button always visible */}
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
        <Text style={styles.title}>📝 Todo Master</Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {completedCount}/{totalCount} completed
          </Text>
          {completedCount > 0 && (
            <TouchableOpacity onPress={clearCompleted} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear Completed</Text>
            </TouchableOpacity>
          )}
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
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
                <Text style={styles.modalButtonText}>
                  {selectedTask?.done ? "Mark Incomplete" : "Mark Complete"}
                </Text>
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
    marginBottom: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ff4757",
    borderRadius: 15,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 12,
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
    paddingHorizontal: 20,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2a2b33",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalTaskText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    width: "100%",
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
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