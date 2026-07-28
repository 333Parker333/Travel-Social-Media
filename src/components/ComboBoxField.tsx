import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  otherOptionLabel?: string;
  placeholder?: string;
};

/**
 * A dropdown of preset options where the last option (otherOptionLabel,
 * e.g. "Other") switches to a free-text field instead of being selected
 * directly, so a value outside the preset list can still be entered.
 */
export function ComboBoxField({
  label,
  value,
  options,
  onChange,
  otherOptionLabel = 'Other',
  placeholder = 'Select',
}: Props) {
  const [visible, setVisible] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  const open = () => {
    const isPreset = options.includes(value);
    setCustomMode(Boolean(value) && !isPreset);
    setCustomText(isPreset ? '' : value);
    setVisible(true);
  };

  const selectOption = (option: string) => {
    if (option === otherOptionLabel) {
      setCustomMode(true);
      return;
    }
    onChange(option);
    setVisible(false);
  };

  const confirmCustom = () => {
    onChange(customText.trim());
    setVisible(false);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={open}>
        <Text style={value ? styles.valueText : styles.placeholderText}>{value || placeholder}</Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            {customMode ? (
              <>
                <Text style={styles.sheetTitle}>{label}</Text>
                <TextInput
                  style={styles.customInput}
                  value={customText}
                  onChangeText={setCustomText}
                  placeholder="Type a value"
                  autoFocus
                />
                <Pressable style={styles.confirmButton} onPress={confirmCustom}>
                  <Text style={styles.confirmButtonText}>Save</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>{label}</Text>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item}
                  style={styles.list}
                  renderItem={({ item }) => (
                    <Pressable style={styles.option} onPress={() => selectOption(item)}>
                      <Text style={[styles.optionText, item === value && styles.optionTextActive]}>{item}</Text>
                    </Pressable>
                  )}
                />
              </>
            )}
            <Pressable style={styles.cancel} onPress={() => setVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  valueText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
  },
  optionTextActive: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancel: {
    alignItems: 'center',
    paddingTop: 16,
  },
  cancelText: {
    color: '#888',
    fontSize: 14,
  },
});
