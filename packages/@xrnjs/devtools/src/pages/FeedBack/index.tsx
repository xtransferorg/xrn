import React, { useCallback, useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  ScrollView,
  Text,
  TextInput,
} from "react-native";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";
import styles from "./style";
import StarRating from "react-native-star-rating-widget";
import { nativeToast } from "../../utils/toast";

const reasons = [
  "设计风格不美观",
  "不会用",
  "不满足需求",
  "功能不全",
  "配套文档不足",
  "性能问题",
  "功能入口太深",
  "交互体验不好",
  "功能分类凌乱",
  "反馈响应慢",
  "功能异常不稳定",
  "其它原因",
];

const percent = ["10%", "20%", "30%", "50%", "70%", "100%"];

const maxLength = 300;
const SCENE_PREFIX = "[需求场景]:";
const SUGGESTING_PREFIX = "[改进建议]:";
const CONTACT_PREFIX = "[联系人]:";

const FeedBack: React.FC = (props: any) => {
  const { navigation } = props;
  const [rating, setRating] = useState(4);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPercent, setSelectedPercent] = useState<string | null>("30%");
  const [sceneText, setSceneText] = useState(SCENE_PREFIX);
  const [suggestionText, setSuggestionText] = useState(SUGGESTING_PREFIX);
  const [contactText, setContactText] = useState(CONTACT_PREFIX);

  const _handleTagPress = (tag: string) => {
    setSelectedTags((prevSelected) =>
      prevSelected.includes(tag)
        ? prevSelected.filter((t) => t !== tag)
        : [...prevSelected, tag]
    );
  };

  const _handleTextChange = (text: string, type: "scene" | "suggestion") => {
    const otherText = type === "scene" ? suggestionText : sceneText;
    if (text.length + otherText.length <= maxLength) {
      if (type === "scene") {
        if (!text.startsWith(SCENE_PREFIX)) {
          setSceneText(SCENE_PREFIX);
        } else {
          setSceneText(text);
        }
      } else {
        if (!text.startsWith(SUGGESTING_PREFIX)) {
          setSuggestionText(SUGGESTING_PREFIX);
        } else {
          setSuggestionText(text);
        }
      }
    }
  };

  const _handleContactTextChange = (text: string) => {
    if (!text.startsWith(CONTACT_PREFIX)) {
      setContactText(CONTACT_PREFIX);
    } else {
      setContactText(text);
    }
  };

  const _confirmClick = () => {
    if (rating < 3 && selectedTags.length < 1) {
      nativeToast("请选择不满意原因，便于后期着重优化，谢谢配合 ☺");
    }

    const trackObj = {
      button_name: "devtools_feedback_confirm",
      devtools_rate: rating,
      devtools_reason: selectedTags.join(","),
      devtools_suggetion: `${sceneText} -> ${suggestionText}`,
      devtools_contact: contactText,
      devtools_efficiency_percent: selectedPercent ? selectedPercent : "",
    };
    nativeToast("反馈成功，谢谢配合 ☺");
    navigation?.goBack();
  };

  return (
    <Page title="功能反馈" hideHeader>
      <ScrollView style={styles.container}>
        <View style={styles.rateBox}>
          <Text style={styles.rateTitle}>
            您对devtools面板提供的相关功能满意吗？
          </Text>
          <View style={styles.tipBox}>
            <Text style={styles.leftTip}>非常不满意</Text>
            <Text style={styles.rightTip}>非常满意</Text>
          </View>
          <View style={styles.rate}>
            <StarRating rating={rating} onChange={setRating} />
          </View>
        </View>
        {rating < 3 ? (
          <View style={styles.reasonBox}>
            <View style={styles.tagTipBox}>
              <Text style={styles.star}>*</Text>
              <Text style={styles.reasonTip}>您感到不满意的原因是？</Text>
            </View>
            <View style={styles.itemBox}>
              {reasons.map((tag, index) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.tag, isSelected && styles.selectedTag]}
                    onPress={() => _handleTagPress(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.selectedTagText,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTip}>您对devtools功能还有哪些意见/建议？</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="[需求场景]:"
              multiline
              textAlignVertical="top"
              value={sceneText}
              onChangeText={(text) => _handleTextChange(text, "scene")}
              selection={{ start: sceneText.length, end: sceneText.length }}
            />
            <TextInput
              style={styles.input}
              placeholder="[改进建议]:"
              multiline
              textAlignVertical="top"
              value={suggestionText}
              onChangeText={(text) => _handleTextChange(text, "suggestion")}
              selection={{
                start: suggestionText.length,
                end: suggestionText.length,
              }}
            />
            <Text style={styles.counter}>
              {sceneText.length + suggestionText.length}/{maxLength}
            </Text>
          </View>
        </View>
        <View style={styles.reasonBox}>
          <View style={styles.tagTipBox}>
            <Text style={styles.reasonTip}>
              您认为devtools调试工具给您调试带来多少提效？
            </Text>
          </View>
          <View style={styles.itemBox}>
            {percent.map((tag, index) => {
              const isSelected = selectedPercent === tag;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.tag, isSelected && styles.selectedTag]}
                  onPress={() => setSelectedPercent(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      isSelected && styles.selectedTagText,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.contactBox}>
          <View style={styles.contactTipBox}>
            <Text style={styles.contactText}>请填写联系人</Text>
            <Text style={styles.contactTip}>
              （便于后期沟通&了解诉求 帮助开发提效）
            </Text>
          </View>
          <TextInput
            style={styles.contactInput}
            placeholder="[联系人]:"
            textAlignVertical="top"
            value={contactText}
            onChangeText={(text) => _handleContactTextChange(text)}
            selection={{ start: contactText.length, end: contactText.length }}
          />
        </View>
        <TouchableOpacity
          style={styles.confirm}
          onPress={() => _confirmClick()}
        >
          <Text style={styles.confirmText}>提交</Text>
        </TouchableOpacity>
      </ScrollView>
    </Page>
  );
};

export default FeedBack;
