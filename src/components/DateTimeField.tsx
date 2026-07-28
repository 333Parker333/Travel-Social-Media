import { useState, type CSSProperties } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Mode = 'date' | 'datetime';

type Props = {
  label: string;
  value: string | null;
  mode: Mode;
  onChange: (value: string | null) => void;
  placeholder?: string;
};

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseValue(value: string | null): Date {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDisplay(value: string | null, mode: Mode, placeholder?: string): string {
  if (!value) {
    return placeholder ?? 'Select';
  }
  const date = parseValue(value);
  return mode === 'date' ? date.toLocaleDateString() : date.toLocaleString();
}

// "YYYY-MM-DDTHH:mm" in LOCAL time, the format <input type="datetime-local">
// expects/emits - not toISOString(), which is UTC and would show the wrong
// wall-clock time to the user.
function toDatetimeLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Android's native pickers only support a single mode (date OR time) per
 * dialog, so a "datetime" field there is a two-step flow: pick the date,
 * then immediately pick the time, then combine them. iOS's picker supports
 * "datetime" directly and renders as a persistent compact control rather
 * than something we show/hide.
 */
export function DateTimeField({ label, value, mode, onChange, placeholder }: Props) {
  const [androidStage, setAndroidStage] = useState<'idle' | 'date' | 'time'>('idle');
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setAndroidStage('idle');
      setPendingDate(null);
      return;
    }

    if (mode === 'datetime' && androidStage === 'date') {
      setPendingDate(selected);
      setAndroidStage('time');
      return;
    }

    if (mode === 'datetime' && androidStage === 'time' && pendingDate) {
      const combined = new Date(pendingDate);
      combined.setHours(selected.getHours(), selected.getMinutes());
      onChange(combined.toISOString());
    } else {
      onChange(mode === 'date' ? toDateOnly(selected) : selected.toISOString());
    }

    setAndroidStage('idle');
    setPendingDate(null);
  };

  const handleIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) {
      return;
    }
    onChange(mode === 'date' ? toDateOnly(selected) : selected.toISOString());
  };

  if (Platform.OS === 'web') {
    const webValue = mode === 'date' ? (value ?? '') : toDatetimeLocalInputValue(parseValue(value));

    const handleWebChange = (event: { target: { value: string } }) => {
      const inputValue = event.target.value;
      if (!inputValue) {
        onChange(null);
        return;
      }
      if (mode === 'date') {
        onChange(inputValue);
      } else {
        onChange(new Date(inputValue).toISOString());
      }
    };

    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        <input
          type={mode === 'date' ? 'date' : 'datetime-local'}
          value={webValue}
          onChange={handleWebChange}
          style={webInputStyle}
        />
      </View>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.iosRow}>
        <Text style={styles.label}>{label}</Text>
        <DateTimePicker value={parseValue(value)} mode={mode} display="default" onChange={handleIosChange} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setAndroidStage('date')}>
        <Text>{formatDisplay(value, mode, placeholder)}</Text>
      </Pressable>
      {androidStage !== 'idle' && (
        <DateTimePicker
          value={androidStage === 'time' && pendingDate ? pendingDate : parseValue(value)}
          mode={androidStage === 'time' ? 'time' : 'date'}
          display="default"
          onChange={handleAndroidChange}
        />
      )}
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
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});

// Plain DOM CSS (not a StyleSheet object) matching the look of `styles.input`,
// for the raw <input> used on web.
const webInputStyle: CSSProperties = {
  border: '1px solid #ccc',
  borderRadius: 8,
  padding: 10,
  fontSize: 16,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};
