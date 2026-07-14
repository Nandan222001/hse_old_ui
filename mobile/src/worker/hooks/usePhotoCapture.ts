import { useState } from 'react';
import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { PhotoAttachment } from '../types';

export function usePhotoCapture(maxPhotos = 5) {
  const [photoUris,    setPhotoUris]    = useState<string[]>([]);
  const [attachments,  setAttachments]  = useState<PhotoAttachment[]>([]);

  const addAsset = (asset: Asset) => {
    if (!asset.uri) return;
    const attachment: PhotoAttachment = {
      uri:  asset.uri,
      name: asset.fileName || `photo_${Date.now()}.jpg`,
      type: asset.type     || 'image/jpeg',
    };
    setPhotoUris(prev => [...prev, asset.uri!]);
    setAttachments(prev => [...prev, attachment]);
  };

  const openCamera = () => {
    launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, res => {
      if (res.didCancel || res.errorCode) return;
      if (res.assets?.[0]) addAsset(res.assets[0]);
    });
  };

  const openGallery = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, res => {
      if (res.didCancel || res.errorCode) return;
      if (res.assets?.[0]) addAsset(res.assets[0]);
    });
  };

  const launch = () => {
    if (photoUris.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can attach up to ${maxPhotos} photos.`);
      return;
    }
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera',  onPress: openCamera  },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel',  style: 'cancel'      },
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return { photoUris, attachments, launch, removePhoto };
}
