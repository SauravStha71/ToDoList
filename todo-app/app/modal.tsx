import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ModalScreen() {
  const router = useRouter();
  const { mode, id, text: initialText, date: initialDate } = useLocalSearchParams<{
    mode?: "add" | "edit";
    id?: string;
    text?: string;
    date?: string;
  }>();

  const isEditing = mode === "edit";
  const [text, setText] = useState(initialText || "");
  const [neverExpire, setNeverExpire] = useState(!initialDate);
  const [dueDate, setDueDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleSave = () => {
    const newTask = {
      id: id || Date.now().toString(),
      text,
      done: false,
      dueDate: neverExpire ? null : dueDate.toISOString(),
      neverExpire,
    };

    // Pass data back to previous screen using params or a shared store
    router.back();
    // If using context or async storage, integrate save logic here.
    console.log("Saved Task:", newTask);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditing ? "Edit Task" : "New Task"}</Text>

      <TextInput
        placeholder="Enter task title"
        placeholderTextColor="#aaa"
        value={text}
        onChangeText={setText}
        style={styles.input}
      />

      <TouchableOpacity
        style={[
          styles.dateButton,
          { backgroundColor: neverExpire ? "#444" : "#4e5bff" },
        ]}
        onPress={() => setShowPicker(true)}
        disabled={neverExpire}
      >
        <Text style={styles.dateText}>
          {neverExpire
            ? "Never Expires"
            : `Due Date: ${dueDate.toDateString()}`}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          onChange={(event, selectedDate) => {
            setShowPicker(Platform.OS === "ios");
            if (selectedDate) setDueDate(selectedDate);
          }}
        />
      )}

      <View style={styles.switchRow}>
        <Switch
          value={neverExpire}
          onValueChange={setNeverExpire}
          thumbColor={neverExpire ? "#4e5bff" : "#777"}
        />
        <Text style={styles.switchLabel}>Never Expire</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4e5bff" }]}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          {isEditing ? "Save Changes" : "Add Task"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#333" }]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1b23",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#2a2b33",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  dateButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  dateText: {
    color: "#fff",
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  switchLabel: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
