import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';

export default function ScanScreen({ navigation, route }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);

    // Extract address from QR code data (might be ethereum:0x... or just the address)
    let address = data;
    if (data.includes(':')) {
      address = data.split(':')[1];
    }
    if (address.includes('?')) {
      address = address.split('?')[0];
    }

    Alert.alert('QR Code Scanned', `Address: ${address}`, [
      {
        text: 'Use This Address',
        onPress: () => {
          if (route.params?.onScan) {
            route.params.onScan(address);
          }
          navigation.goBack();
        }
      },
      {
        text: 'Scan Again',
        onPress: () => setScanned(false)
      }
    ]);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={getCameraPermissions}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instructions}>Position QR code within the frame</Text>
        </View>
      </CameraView>

      {scanned && (
        <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
          <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2027',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    color: '#b2ebf2',
    fontSize: 16,
    marginBottom: 20
  },
  button: {
    backgroundColor: '#00eaff',
    padding: 15,
    borderRadius: 10
  },
  buttonText: {
    color: '#0f2027',
    fontSize: 16,
    fontWeight: 'bold'
  },
  camera: {
    flex: 1,
    width: '100%'
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative'
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00eaff'
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10
  },
  rescanButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#00eaff',
    padding: 15,
    borderRadius: 10
  },
  rescanButtonText: {
    color: '#0f2027',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

ScanScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired
};
