import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  units: "mm";
};

const STORAGE_KEY = "@bimstudio/projects/v1";

const COLORS = {
  background: "#0B0E13",
  surface: "#131821",
  surfaceLight: "#1A2230",
  border: "#293343",
  text: "#F2F5FA",
  muted: "#9AA7B8",
  accent: "#62A8FF",
  accentDark: "#18365B",
  danger: "#FF7373",
  success: "#70D6A0"
};

function makeId(): string {
  return `project_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!mounted) return;

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            setProjects(parsed as Project[]);
          }
        }
      } catch {
        Alert.alert(
          "Storage error",
          "Saved projects could not be loaded. Your existing data has not been intentionally deleted."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) =>
      project.name.toLowerCase().includes(query)
    );
  }, [projects, search]);

  async function saveProjects(nextProjects: Project[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));
    setProjects(nextProjects);
  }

  async function createProject() {
    const name = projectName.trim();

    if (!name) {
      Alert.alert("Project name required", "Enter a name for your project.");
      return;
    }

    if (name.length > 60) {
      Alert.alert(
        "Name too long",
        "Project names must contain 60 characters or fewer."
      );
      return;
    }

    const duplicate = projects.some(
      (project) => project.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      Alert.alert(
        "Project already exists",
        "Use a different name for this project."
      );
      return;
    }

    const now = new Date().toISOString();

    const newProject: Project = {
      id: makeId(),
      name,
      createdAt: now,
      updatedAt: now,
      units: "mm"
    };

    setSaving(true);

    try {
      await saveProjects([newProject, ...projects]);
      setProjectName("");
      setCreateVisible(false);
      setSearch("");
      setSelectedProjectId(newProject.id);
    } catch {
      Alert.alert(
        "Could not save project",
        "The project was not saved. Check your available device storage and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(project: Project) {
    Alert.alert(
      "Delete project?",
      `“${project.name}” will be removed from this device. This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const nextProjects = projects.filter(
                (item) => item.id !== project.id
              );

              try {
                await saveProjects(nextProjects);

                if (selectedProjectId === project.id) {
                  setSelectedProjectId(null);
                }
              } catch {
                Alert.alert(
                  "Delete failed",
                  "The project could not be removed from storage."
                );
              }
            })();
          }
        }
      ]
    );
  }

  function openProject(project: Project) {
    setSelectedProjectId(project.id);
  }

  function closeProject() {
    setSelectedProjectId(null);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Text style={styles.brand}>BIM<Text style={styles.brandAccent}>Studio</Text></Text>
        <ActivityIndicator
          size="large"
          color={COLORS.accent}
          style={styles.loader}
        />
        <Text style={styles.mutedText}>Loading your projects...</Text>
      </SafeAreaView>
    );
  }

  if (selectedProject) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to projects"
            onPress={closeProject}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.topBarTitleArea}>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {selectedProject.name}
            </Text>
            <Text style={styles.topBarSubtitle}>PROJECT WORKSPACE</Text>
          </View>

          <View style={styles.roundMark}>
            <Text style={styles.roundMarkText}>B</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.workspaceContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.workspaceHeader}>
            <Text style={styles.eyebrow}>BIM PROJECT</Text>
            <Text style={styles.workspaceTitle}>{selectedProject.name}</Text>
            <Text style={styles.bodyText}>
              Your project record is saved locally on this device.
            </Text>
          </View>

          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Project information</Text>
            <View style={styles.savedBadge}>
              <View style={styles.savedDot} />
              <Text style={styles.savedBadgeText}>Local</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <InfoRow
              label="Project name"
              value={selectedProject.name}
            />
            <InfoRow
              label="Created"
              value={formatDate(selectedProject.createdAt)}
            />
            <InfoRow
              label="Last updated"
              value={formatDate(selectedProject.updatedAt)}
            />
            <InfoRow
              label="Measurement units"
              value="Millimetres (mm)"
              last
            />
          </View>

          <Text style={[styles.sectionTitle, styles.modelSectionTitle]}>
            Model workspace
          </Text>

          <View style={styles.canvasCard}>
            <View style={styles.canvasGrid}>
              {Array.from({ length: 7 }).map((_, index) => (
                <View
                  key={`row-${index}`}
                  style={styles.gridLineHorizontal}
                />
              ))}
              {Array.from({ length: 7 }).map((_, index) => (
                <View
                  key={`column-${index}`}
                  style={styles.gridLineVertical}
                />
              ))}
              <View style={styles.originMarker}>
                <View style={styles.originHorizontal} />
                <View style={styles.originVertical} />
              </View>
            </View>

            <View style={styles.canvasLabel}>
              <Text style={styles.canvasLabelTitle}>Workspace ready</Text>
              <Text style={styles.canvasLabelText}>
                Drawing and 3D modelling tools are not implemented in this
                initial version.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Project management</Text>

          <Pressable
            style={styles.dangerAction}
            onPress={() => confirmDelete(selectedProject)}
          >
            <Text style={styles.dangerActionTitle}>Delete this project</Text>
            <Text style={styles.dangerActionDescription}>
              Permanently remove its saved project record from this device.
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={styles.homeContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <View style={styles.logoLineOne} />
              <View style={styles.logoLineTwo} />
              <View style={styles.logoLineThree} />
            </View>

            <View>
              <Text style={styles.brand}>
                BIM<Text style={styles.brandAccent}>Studio</Text>
              </Text>
              <Text style={styles.brandCaption}>BUILDING DESIGN WORKSPACE</Text>
            </View>
          </View>

          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>ANDROID</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>YOUR DESIGN SPACE</Text>
          <Text style={styles.heroTitle}>
            Design with{"\n"}
            <Text style={styles.heroAccent}>precision.</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Create and organise your building design projects in one workspace.
          </Text>

          <View style={styles.heroBottomRow}>
            <View>
              <Text style={styles.heroStatValue}>{projects.length}</Text>
              <Text style={styles.heroStatLabel}>
                {projects.length === 1 ? "SAVED PROJECT" : "SAVED PROJECTS"}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setCreateVisible(true)}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed
              ]}
            >
              <Text style={styles.primaryButtonPlus}>＋</Text>
              <Text style={styles.primaryButtonText}>New project</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Your projects</Text>
          <Text style={styles.countText}>{projects.length} total</Text>
        </View>

        {projects.length > 0 && (
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />
        )}

        {filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>＋</Text>
            </View>

            <Text style={styles.emptyTitle}>
              {projects.length === 0
                ? "Start your first project"
                : "No matching projects"}
            </Text>

            <Text style={styles.emptyDescription}>
              {projects.length === 0
                ? "Create a project to begin organising your building design work."
                : "Try a different search term."}
            </Text>

            {projects.length === 0 && (
              <Pressable
                onPress={() => setCreateVisible(true)}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed
                ]}
              >
                <Text style={styles.secondaryButtonText}>
                  Create your first project
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.projectList}>
            {filteredProjects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openProject(project)}
                  style={({ pressed }) => [
                    styles.projectMain,
                    pressed && styles.pressed
                  ]}
                >
                  <View style={styles.projectIcon}>
                    <Text style={styles.projectIconText}>B</Text>
                  </View>

                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {project.name}
                    </Text>
                    <Text style={styles.projectMeta}>
                      Created {formatDate(project.createdAt)}
                    </Text>
                    <View style={styles.projectTagRow}>
                      <View style={styles.projectTag}>
                        <Text style={styles.projectTagText}>BIM PROJECT</Text>
                      </View>
                      <Text style={styles.projectUnits}>mm</Text>
                    </View>
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${project.name}`}
                  onPress={() => confirmDelete(project)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>BIMStudio</Text>
          <Text style={styles.footerText}>
            Project records are stored on this device. Cloud sync and the
            geometry engine are not included in this initial version.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={createVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!saving) setCreateVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalEyebrow}>NEW WORKSPACE</Text>
            <Text style={styles.modalTitle}>Create a project</Text>
            <Text style={styles.modalDescription}>
              Give your building project a name.
            </Text>

            <Text style={styles.inputLabel}>PROJECT NAME</Text>
            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="e.g. Residential Building"
              placeholderTextColor={COLORS.muted}
              style={styles.nameInput}
              autoFocus
              maxLength={60}
              editable={!saving}
              returnKeyType="done"
              onSubmitEditing={() => void createProject()}
            />

            <Text style={styles.inputHint}>
              Default measurement unit: millimetres (mm)
            </Text>

            <Pressable
              disabled={saving}
              onPress={() => void createProject()}
              style={({ pressed }) => [
                styles.modalPrimaryButton,
                pressed && styles.pressed,
                saving && styles.disabledButton
              ]}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.modalPrimaryButtonText}>
                  Create project
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={() => {
                setCreateVisible(false);
                setProjectName("");
              }}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  last = false
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center"
  },
  loader: {
    marginTop: 28,
    marginBottom: 14
  },
  topBar: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logoMark: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: COLORS.accentDark,
    borderWidth: 1,
    borderColor: "#2D527C",
    justifyContent: "center",
    alignItems: "center",
    gap: 3
  },
  logoLineOne: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accent
  },
  logoLineTwo: {
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accent
  },
  logoLineThree: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accent
  },
  brand: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -1
  },
  brandAccent: {
    color: COLORS.accent
  },
  brandCaption: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 8,
    letterSpacing: 1.35,
    fontWeight: "700"
  },
  versionBadge: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7
  },
  versionBadgeText: {
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700"
  },
  homeContent: {
    paddingBottom: 36
  },
  hero: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    overflow: "hidden"
  },
  eyebrow: {
    color: COLORS.accent,
    fontWeight: "800",
    letterSpacing: 1.6,
    fontSize: 10
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 37,
    lineHeight: 43,
    fontWeight: "800",
    letterSpacing: -1.4,
    marginTop: 16
  },
  heroAccent: {
    color: COLORS.accent
  },
  heroDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 270
  },
  heroBottomRow: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  heroStatValue: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "800"
  },
  heroStatLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 3
  },
  primaryButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    gap: 6
  },
  primaryButtonPlus: {
    fontSize: 21,
    color: "#07111D",
    fontWeight: "700",
    marginTop: -2
  },
  primaryButtonText: {
    color: "#07111D",
    fontWeight: "800",
    fontSize: 12
  },
  sectionHeadingRow: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  countText: {
    color: COLORS.muted,
    fontSize: 11
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    fontSize: 14
  },
  emptyState: {
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 34,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderStyle: "dashed"
  },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.accentDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  emptyIconText: {
    color: COLORS.accent,
    fontSize: 30,
    fontWeight: "300",
    marginTop: -2
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 260
  },
  secondaryButton: {
    marginTop: 20,
    minHeight: 43,
    borderRadius: 9,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
    borderColor: COLORS.accent,
    borderWidth: 1
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700"
  },
  projectList: {
    paddingHorizontal: 20,
    gap: 12
  },
  projectCard: {
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14
  },
  projectMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  projectIcon: {
    width: 47,
    height: 47,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border
  },
  projectIconText: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: "800"
  },
  projectInfo: {
    flex: 1,
    minWidth: 0
  },
  projectName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800"
  },
  projectMeta: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5
  },
  projectTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8
  },
  projectTag: {
    backgroundColor: COLORS.accentDark,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5
  },
  projectTagText: {
    color: COLORS.accent,
    fontWeight: "800",
    fontSize: 8,
    letterSpacing: 0.5
  },
  projectUnits: {
    color: COLORS.muted,
    fontSize: 10
  },
  chevron: {
    fontSize: 27,
    color: COLORS.muted,
    marginHorizontal: 2
  },
  deleteButton: {
    alignSelf: "flex-end",
    paddingVertical: 7,
    paddingHorizontal: 5,
    marginTop: 7
  },
  deleteButtonText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: "600"
  },
  footer: {
    paddingHorizontal: 22,
    marginTop: 32
  },
  footerTitle: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 11
  },
  footerText: {
    color: "#758195",
    fontSize: 10,
    lineHeight: 17,
    marginTop: 6
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 32,
    lineHeight: 35,
    marginTop: -4
  },
  topBarTitleArea: {
    flex: 1,
    marginHorizontal: 12,
    minWidth: 0
  },
  topBarTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800"
  },
  topBarSubtitle: {
    color: COLORS.muted,
    fontSize: 8,
    letterSpacing: 1.2,
    marginTop: 4,
    fontWeight: "700"
  },
  roundMark: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.accentDark,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  roundMarkText: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "800"
  },
  workspaceContent: {
    padding: 20,
    paddingBottom: 40
  },
  workspaceHeader: {
    paddingTop: 12,
    paddingBottom: 24
  },
  workspaceTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginTop: 9
  },
  bodyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    backgroundColor: "#153427",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  savedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success
  },
  savedBadgeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: "700"
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    marginBottom: 28
  },
  infoRow: {
    paddingVertical: 14,
    gap: 6
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  infoLabel: {
    color: COLORS.muted,
    fontSize: 11
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700"
  },
  modelSectionTitle: {
    marginBottom: 13
  },
  canvasCard: {
    height: 218,
    backgroundColor: "#101620",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 28
  },
  canvasGrid: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  gridLineHorizontal: {
    height: 1,
    width: "100%",
    backgroundColor: "#1B2635",
    position: "absolute"
  },
  gridLineVertical: {
    width: 1,
    height: "100%",
    backgroundColor: "#1B2635",
    position: "absolute"
  },
  originMarker: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  originHorizontal: {
    width: 22,
    height: 2,
    backgroundColor: COLORS.accent,
    position: "absolute"
  },
  originVertical: {
    width: 2,
    height: 22,
    backgroundColor: "#F28E77",
    position: "absolute"
  },
  canvasLabel: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    borderRadius: 9,
    backgroundColor: "#171F2B",
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 11
  },
  canvasLabelTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 11
  },
  canvasLabelText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4
  },
  dangerAction: {
    borderWidth: 1,
    borderColor: "#56323A",
    backgroundColor: "#23181F",
    borderRadius: 12,
    padding: 15,
    marginTop: 14
  },
  dangerActionTitle: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "800"
  },
  dangerActionDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: 20
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 22
  },
  modalHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 23
  },
  modalEyebrow: {
    color: COLORS.accent,
    letterSpacing: 1.4,
    fontSize: 9,
    fontWeight: "800"
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 24,
    letterSpacing: -0.5,
    fontWeight: "800",
    marginTop: 8
  },
  modalDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 23
  },
  inputLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8
  },
  nameInput: {
    minHeight: 49,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.text,
    paddingHorizontal: 13,
    fontSize: 14
  },
  inputHint: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 9,
    marginBottom: 22
  },
  modalPrimaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center"
  },
  modalPrimaryButtonText: {
    color: "#07111D",
    fontWeight: "800",
    fontSize: 13
  },
  modalCancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6
  },
  modalCancelText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  disabledButton: {
    opacity: 0.6
  },
  pressed: {
    opacity: 0.72
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 12
  }
});
