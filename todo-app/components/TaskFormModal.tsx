import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Switch,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export interface TaskFormData {
  text: string;
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  neverExpire?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  initialData?: TaskFormData;
  isEditing?: boolean;
}

export default function TaskFormModal({
  visible,
  onClose,
  onSave,
  initialData,
  isEditing = false,
}: Props) {
  const [text, setText] = useState(initialData?.text || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    initialData?.priority || "medium"
  );
  const [neverExpire, setNeverExpire] = useState(initialData?.neverExpire || false);
  const [dueDate, setDueDate] = useState<Date>(
    initialData?.dueDate ? new Date(initialData.dueDate) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleSave = () => {
    if (!text.trim()) return;
    onSave({
      text,
      priority,
      dueDate: neverExpire ? null : dueDate.toISOString(),
      neverExpire,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{isEditing ? "Edit Task" : "New Task"}</Text>

          <TextInput
            placeholder="Enter task"
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            style={styles.input}
          />

          <View style={styles.priorityRow}>
            {["low", "medium", "high"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                onPress={() => setPriority(lvl as any)}
                style={[
                  styles.priorityOption,
                  priority === lvl && { backgroundColor: "#4834d4" },
                ]}
              >
                <Text style={styles.priorityText}>{lvl.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: neverExpire ? "#3a3b43" : "#4834d4" },
            ]}
            onPress={() => setShowPicker(true)}
            disabled={neverExpire}
          >
            <Text style={{ color: "#fff" }}>
              {neverExpire
                ? "Never Expires"
                : `Due: ${dueDate.toDateString()}`}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              onChange={(e, date) => {
                setShowPicker(false);
                if (date) setDueDate(date);
              }}
            />
          )}

          <View style={styles.switchRow}>
            <Switch
              value={neverExpire}
              onValueChange={setNeverExpire}
              thumbColor={neverExpire ? "#4834d4" : "#888"}
            />
            <Text style={styles.switchLabel}>Never Expire</Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>{isEditing ? "Save Changes" : "Add Task"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  modal: { backgroundColor: "#2a2b33", padding: 20, borderRadius: 15, width: "85%" },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: { backgroundColor: "#1a1b23", color: "#fff", padding: 12, borderRadius: 8, marginBottom: 15 },
  priorityRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  priorityOption: { flex: 1, marginHorizontal: 4, padding: 10, backgroundColor: "#3a3b43", borderRadius: 8, alignItems: "center" },
  priorityText: { color: "#fff", fontWeight: "600" },
  dateButton: { padding: 10, borderRadius: 8, alignItems: "center", marginBottom: 15 },
  switchRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  switchLabel: { color: "#fff", marginLeft: 10 },
  saveBtn: { backgroundColor: "#4834d4", padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelText: { color: "#888", textAlign: "center" },
});
