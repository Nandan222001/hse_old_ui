import React from 'react';
import { Icon } from '../display/Icon';
import { View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface PhotoUploadBoxProps {
  /** Already captured photo URIs */
  photos?: string[];
  onTakePhoto?: () => void;
  onPickGallery?: () => void;
  onRemove?: (index: number) => void;
  title?: string;
  subtitle?: string;
  maxPhotos?: number;
  style?: ViewStyle;
}

export function PhotoUploadBox({
  photos = [],
  onTakePhoto,
  onPickGallery,
  onRemove,
  title = 'Add Photo',
  subtitle = 'Tap to take or upload photo',
  maxPhotos = 5,
  style,
}: PhotoUploadBoxProps) {
  const canAdd = photos.length < maxPhotos;

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.row}>
        {/* Add button */}
        {canAdd && (
          <TouchableOpacity style={styles.addBox} onPress={onTakePhoto} activeOpacity={0.8}>
            <Icon name="camera" style={styles.addIcon} color={Colors.blue} />
            <Text style={styles.addTitle}>{title}</Text>
            {onPickGallery && (
              <TouchableOpacity onPress={onPickGallery}>
                <Text style={styles.galleryLink}>or Gallery</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}

        {/* Preview thumbnails */}
        {photos.map((uri, i) => (
          <View key={i} style={styles.preview}>
            <Image source={{ uri }} style={styles.thumb} />
            {onRemove && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(i)}>
                <Icon emoji="✕" style={styles.removeIcon} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Empty dashed placeholder when no photos */}
        {photos.length === 0 && !canAdd && (
          <View style={styles.emptyDash}>
            <Text style={styles.emptyText}>No photos added</Text>
          </View>
        )}
      </View>

      <Text style={styles.hint}>{subtitle}</Text>
    </View>
  );
}

/** Simpler single dashed upload box (for attachments / JSA file) */
interface AttachBoxProps {
  icon?: string;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function AttachBox({ icon = '☁️', title = 'Attach file', subtitle = 'PDF, JPG, or PNG (Max 5MB)', onPress, style }: AttachBoxProps) {
  return (
    <TouchableOpacity style={[styles.attachBox, style]} onPress={onPress} activeOpacity={0.8}>
      <Icon emoji={icon} style={styles.attachIcon} color={Colors.blue} />
      <Text style={styles.attachTitle}>{title}</Text>
      <Text style={styles.attachSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  addBox: {
    width: 110, height: 110, borderWidth: 2, borderColor: Colors.border,
    borderStyle: 'dashed', borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFF',
  },
  addIcon: { fontSize: 26, marginBottom: 4 },
  addTitle: { fontSize: 12, color: Colors.blue, fontWeight: '600', textAlign: 'center' },
  galleryLink: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  preview: { width: 110, height: 110, borderRadius: 14, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 3,
  },
  removeIcon: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  emptyDash: {
    flex: 1, minHeight: 80, borderWidth: 2, borderColor: Colors.border,
    borderStyle: 'dashed', borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 13, color: Colors.textLight },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },

  attachBox: {
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: 14, padding: 22, alignItems: 'center', backgroundColor: '#F8FAFF',
  },
  attachIcon: { fontSize: 30, marginBottom: 8 },
  attachTitle: { fontSize: 14, fontWeight: '600', color: Colors.blue, marginBottom: 3 },
  attachSub: { fontSize: 12, color: Colors.textMuted },
});
