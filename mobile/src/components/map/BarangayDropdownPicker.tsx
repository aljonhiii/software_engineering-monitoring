import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ZAMBOANGA_BARANGAYS,
  ZamboangaBarangay,
  searchBarangays,
  fetchZamboangaPlaces,
  LivePlaceResult,
} from '../../constants/zamboangaBarangays';
import { Colors, Spacing } from '../../constants/theme';

export interface SelectedPlace {
  name: string;
  lat: number;
  lng: number;
  barangay: string;
  address?: string;
  isCustomPlace?: boolean;
}

interface BarangayDropdownPickerProps {
  selectedBarangay: string;
  selectedAddress?: string;
  onSelect: (place: SelectedPlace) => void;
}

export const BarangayDropdownPicker: React.FC<BarangayDropdownPickerProps> = ({
  selectedBarangay,
  selectedAddress,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState<'ALL' | 1 | 2>('ALL');
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [liveResults, setLiveResults] = useState<LivePlaceResult[]>([]);

  // Filter local official 98 barangays instantly
  const filteredBarangays = useMemo(() => {
    const filter = districtFilter === 'ALL' ? undefined : districtFilter;
    return searchBarangays(searchQuery, filter);
  }, [searchQuery, districtFilter]);

  // Live map search trigger
  const handleLiveSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setIsSearchingApi(true);
    const places = await fetchZamboangaPlaces(searchQuery);
    setLiveResults(places);
    setIsSearchingApi(false);
  };

  const handleSelectBarangay = (item: ZamboangaBarangay) => {
    onSelect({
      name: item.name,
      lat: item.lat,
      lng: item.lng,
      barangay: item.name,
      address: item.landmark ? `${item.landmark}, Brgy. ${item.name}` : `Brgy. ${item.name}`,
      isCustomPlace: false,
    });
    setModalVisible(false);
    setSearchQuery('');
    setLiveResults([]);
  };

  const handleSelectLivePlace = (place: LivePlaceResult) => {
    onSelect({
      name: place.title,
      lat: place.lat,
      lng: place.lng,
      barangay: place.barangay || 'Zamboanga City',
      address: `${place.title}, ${place.subtitle}`,
      isCustomPlace: true,
    });
    setModalVisible(false);
    setSearchQuery('');
    setLiveResults([]);
  };

  const currentBarangayObj = useMemo(() => {
    return ZAMBOANGA_BARANGAYS.find(
      (b) => b.name.toLowerCase() === selectedBarangay.toLowerCase()
    );
  }, [selectedBarangay]);

  return (
    <View style={styles.container}>
      {/* Sleek Dropdown Trigger Button */}
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.iconCircle}>
          <Feather name="map-pin" size={15} color={Colors.indigo} />
        </View>

        <View style={styles.triggerTextContainer}>
          <Text style={styles.triggerLabel}>Barangay / Place in Zamboanga</Text>
          <Text style={styles.triggerValue} numberOfLines={1}>
            {selectedBarangay
              ? currentBarangayObj
                ? `${currentBarangayObj.name} (District ${currentBarangayObj.district})`
                : selectedBarangay
              : 'Choose from 98 Zamboanga Barangays...'}
          </Text>
        </View>

        <View style={styles.chevronWrap}>
          <Feather name="chevron-down" size={18} color="#64748B" />
        </View>
      </TouchableOpacity>

      {/* Full Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Location</Text>
                <Text style={styles.modalSubtitle}>
                  98 Zamboanga City Barangays & Places
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarRow}>
              <Feather name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search barangay, mall, landmark..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (!text.trim()) setLiveResults([]);
                }}
                onSubmitEditing={handleLiveSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setLiveResults([]);
                  }}
                  style={styles.clearSearchBtn}
                >
                  <Feather name="x-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* District Filter Pills */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterPill, districtFilter === 'ALL' && styles.filterPillActive]}
                onPress={() => setDistrictFilter('ALL')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    districtFilter === 'ALL' && styles.filterPillTextActive,
                  ]}
                >
                  All (98)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, districtFilter === 1 && styles.filterPillActive]}
                onPress={() => setDistrictFilter(1)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    districtFilter === 1 && styles.filterPillTextActive,
                  ]}
                >
                  District 1 • West (38)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, districtFilter === 2 && styles.filterPillActive]}
                onPress={() => setDistrictFilter(2)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    districtFilter === 2 && styles.filterPillTextActive,
                  ]}
                >
                  District 2 • East (60)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Live Search Trigger Card if searching */}
            {searchQuery.trim().length >= 2 && (
              <TouchableOpacity
                style={styles.liveSearchActionCard}
                onPress={handleLiveSearch}
                disabled={isSearchingApi}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="google-maps" size={20} color={Colors.indigo} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveSearchTitle}>
                    {isSearchingApi ? 'Searching Map API...' : `Search "${searchQuery}" on Map API`}
                  </Text>
                  <Text style={styles.liveSearchSub}>
                    Find specific malls, universities, hospitals, or streets
                  </Text>
                </View>
                {isSearchingApi ? (
                  <ActivityIndicator size="small" color={Colors.indigo} />
                ) : (
                  <Feather name="arrow-right" size={18} color={Colors.indigo} />
                )}
              </TouchableOpacity>
            )}

            {/* List of Live Search Results (if available) */}
            {liveResults.length > 0 && (
              <View style={styles.liveResultsSection}>
                <Text style={styles.sectionHeaderLabel}>MAP API SEARCH RESULTS</Text>
                {liveResults.map((place, idx) => (
                  <TouchableOpacity
                    key={`live-${idx}`}
                    style={styles.liveResultRow}
                    onPress={() => handleSelectLivePlace(place)}
                  >
                    <View style={styles.liveResultIcon}>
                      <MaterialCommunityIcons name="map-marker-star" size={18} color="#EA580C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.placeTitle}>{place.title}</Text>
                      <Text style={styles.placeSubtitle}>{place.subtitle}</Text>
                    </View>
                    <Feather name="corner-down-left" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* List of 98 Official Barangays */}
            <FlatList
              data={filteredBarangays}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected =
                  selectedBarangay.toLowerCase() === item.name.toLowerCase();

                return (
                  <TouchableOpacity
                    style={[styles.barangayRow, isSelected && styles.barangayRowSelected]}
                    onPress={() => handleSelectBarangay(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.pinIconBox,
                        isSelected && styles.pinIconBoxSelected,
                      ]}
                    >
                      <Feather
                        name="map-pin"
                        size={15}
                        color={isSelected ? '#FFFFFF' : '#64748B'}
                      />
                    </View>

                    <View style={styles.barangayInfo}>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.barangayName,
                            isSelected && styles.barangayNameSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        <View
                          style={[
                            styles.districtTag,
                            item.district === 1
                              ? styles.districtTag1
                              : styles.districtTag2,
                          ]}
                        >
                          <Text
                            style={[
                              styles.districtTagText,
                              item.district === 1
                                ? styles.districtTagText1
                                : styles.districtTagText2,
                            ]}
                          >
                            D{item.district}
                          </Text>
                        </View>
                      </View>

                      {item.landmark && (
                        <Text style={styles.landmarkText} numberOfLines={1}>
                          {item.landmark}
                        </Text>
                      )}
                    </View>

                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Feather name="check" size={16} color={Colors.indigo} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="search" size={32} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No matching barangay found</Text>
                  <Text style={styles.emptySub}>
                    Try searching via the Map API button above.
                  </Text>
                </View>
              }
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  triggerTextContainer: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  triggerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  chevronWrap: {
    marginLeft: 6,
    padding: 4,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: Colors.indigo,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  liveSearchActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    marginTop: 8,
  },
  liveSearchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.indigo,
  },
  liveSearchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  liveResultsSection: {
    marginTop: 10,
    marginBottom: 4,
  },
  sectionHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  liveResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  liveResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  listContent: {
    paddingVertical: Spacing.xs,
  },
  barangayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  barangayRowSelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
  },
  pinIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pinIconBoxSelected: {
    backgroundColor: Colors.indigo,
  },
  barangayInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barangayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  barangayNameSelected: {
    color: Colors.indigo,
    fontWeight: '700',
  },
  districtTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  districtTag1: {
    backgroundColor: '#E0F2FE',
  },
  districtTag2: {
    backgroundColor: '#FEF3C7',
  },
  districtTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  districtTagText1: {
    color: '#0284C7',
  },
  districtTagText2: {
    color: '#D97706',
  },
  landmarkText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
