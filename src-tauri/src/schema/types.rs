use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use ts_rs::TS;

/*
   #[ts(optional)] means use val?: String instean of val: String | null
   It's mandatory everywhere, because you can't v-model String | null in radix-vue.
   Hopefully this gets released soon and it can be set on struct level
   https://github.com/Aleph-Alpha/ts-rs/pull/366

   (the same thing for serde is  #[serde_with::skip_serializing_none] btw)
*/

#[derive(Serialize, Deserialize, Clone, Hash, Debug, PartialEq, TS)]
#[ts(export)]
#[ts(optional_fields)]
pub struct DatePair {
    pub started: Option<String>,
    pub finished: Option<String>,
}

/*
    AttrValue represents types that can be found in frontmatter.
*/
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(tag = "type", content = "value")]
pub enum AttrValue {
    String(Option<String>),
    StringVec(Option<Vec<String>>),
    DatePairVec(Option<Vec<DatePair>>),
    /**
     * 1. Integer and float are split for better readability of frontmatter. Year: 2025.0 looks stupid
     * 2. Integer is stored as f64 becuase i64 can theoretically convert to bigint after getting to js, which is incovenitent.
     *
     * Both those issues might be solved in a more optimal way in the future.
     */
    Integer(Option<f64>),
    Float(Option<f64>),
}

/*
  Helper type just for saving to disk. For readability of frontmatter it should be unttaged, while in TS we need tagged values.
*/
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum AttrValueOnDisk {
    String(Option<String>),
    StringVec(Option<Vec<String>>),
    DatePairVec(Option<Vec<DatePair>>),
    Integer(Option<i64>),
    Float(Option<f64>),
}

impl From<AttrValue> for AttrValueOnDisk {
    fn from(attr: AttrValue) -> Self {
        match attr {
            AttrValue::String(v) => AttrValueOnDisk::String(v),
            AttrValue::StringVec(v) => AttrValueOnDisk::StringVec(v),
            AttrValue::DatePairVec(v) => AttrValueOnDisk::DatePairVec(v),
            AttrValue::Integer(v) => AttrValueOnDisk::Integer(v.map(|x| x.round() as i64)),
            AttrValue::Float(v) => AttrValueOnDisk::Float(v),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(tag = "type", content = "settings")]
pub enum SchemaAttrType {
    Text(TextSettings),
    TextCollection(TextCollectionSettings),
    Number(NumberSettings),
    Date(DateSettings),
    DateCollection(DateCollectionSettings),
    DatesPairCollection(DatesPairCollectionSettings),
    Image(ImageSettings),
}

/*
    These types are not needed in rust, but useful in typescript
    Typescript confuses types with common fields unless they have unique identifier:
    The proper way in TS is extends, but rust has no inheritance and we rely on type generation
*/
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[derive(Default)]
pub enum SettingsTypeText {
    #[default]
    Text,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[derive(Default)]
pub enum SettingsTypeNumber {
    #[default]
    Num,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[derive(Default)]
pub enum SettingsTypeTextCollection {
    #[default]
    TextCollection,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[derive(Default)]
pub enum SettingsTypeImage {
    #[default]
    Image,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[derive(Default)]
pub enum SettingsTypeDate {
    #[default]
    Date,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[derive(Default)]
pub enum SettingsTypeDateCollection {
    #[default]
    DateCollection,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[derive(Default)]
pub enum SettingsTypeDatesPairCollection {
    #[default]
    DatesPairCollection,
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[ts(optional_fields)]
#[serde_with::skip_serializing_none]
#[serde(default = "TextSettings::default")]
pub struct TextSettings {
    pub settings_type: SettingsTypeText,

    pub display_name: Option<String>,

    pub size: Option<InputSize>,
    pub font: Option<TextFont>,
    pub weight: Option<TextWeight>,
    pub is_multiline: Option<bool>,
}
impl Default for TextSettings {
    fn default() -> TextSettings {
        TextSettings {
            settings_type: SettingsTypeText::Text,
            display_name: None,
            size: None,
            font: None,
            weight: None,
            is_multiline: None,
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[ts(optional_fields)]
#[serde_with::skip_serializing_none]
#[serde(default = "NumberSettings::default")]
pub struct NumberSettings {
    #[serde(default)]
    pub settings_type: SettingsTypeNumber,

    pub display_name: Option<String>,

    pub size: Option<InputSize>,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub decimal_places: Option<u8>,
    pub style: Option<NumberStyle>,
    // Stars only
    pub stars_count: Option<u8>,
}

impl Default for NumberSettings {
    fn default() -> NumberSettings {
        NumberSettings {
            settings_type: SettingsTypeNumber::Num,
            display_name: None,
            size: None,
            min: None,
            max: None,
            style: None,
            decimal_places: None,
            stars_count: None,
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[ts(optional_fields)]
#[serde_with::skip_serializing_none]
#[serde(default = "TextCollectionSettings::default")]
pub struct TextCollectionSettings {
    #[serde(default)]
    pub settings_type: SettingsTypeTextCollection,
    pub display_name: Option<String>,
    pub size: Option<InputSize>,
    pub font: Option<TextFont>,
    pub weight: Option<TextWeight>,
    pub prefix: Option<String>,
}
impl Default for TextCollectionSettings {
    fn default() -> TextCollectionSettings {
        TextCollectionSettings {
            settings_type: SettingsTypeTextCollection::TextCollection,
            display_name: None,
            size: None,
            font: None,
            weight: None,
            prefix: None,
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[ts(optional_fields)]
#[serde_with::skip_serializing_none]
#[serde(default = "ImageSettings::default")]
pub struct ImageSettings {
    #[serde(default)]
    pub settings_type: SettingsTypeImage,
    pub display_name: Option<String>,
    pub aspect_ratio: Option<String>,
}
impl Default for ImageSettings {
    fn default() -> ImageSettings {
        ImageSettings {
            settings_type: SettingsTypeImage::Image,
            display_name: None,
            aspect_ratio: None,
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[ts(optional_fields)]
#[serde_with::skip_serializing_none]
#[serde(default = "DateSettings::default")]
pub struct DateSettings {
    pub settings_type: SettingsTypeDate,
    pub display_name: Option<String>,
}

impl Default for DateSettings {
    fn default() -> DateSettings {
        DateSettings {
            settings_type: SettingsTypeDate::Date,
            display_name: None,
        }
    }
}
#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[ts(optional_fields)]
#[serde_with::skip_serializing_none]
#[serde(default = "DateCollectionSettings::default")]
pub struct DateCollectionSettings {
    pub settings_type: SettingsTypeDateCollection,
    pub display_name: Option<String>,
}

impl Default for DateCollectionSettings {
    fn default() -> DateCollectionSettings {
        DateCollectionSettings {
            settings_type: SettingsTypeDateCollection::DateCollection,
            display_name: None,
        }
    }
}
#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[ts(optional_fields)]
#[serde(default = "DatesPairCollectionSettings::default")]
pub struct DatesPairCollectionSettings {
    pub settings_type: SettingsTypeDatesPairCollection,
    pub display_name: Option<String>,
}

impl Default for DatesPairCollectionSettings {
    fn default() -> DatesPairCollectionSettings {
        DatesPairCollectionSettings {
            settings_type: SettingsTypeDatesPairCollection::DatesPairCollection,
            display_name: None,
        }
    }
}
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum InputSize {
    S,
    M,
    L,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TextFont {
    Serif,
    Sans,
}
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TextWeight {
    Light,
    Normal,
    Bold,
    Black,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum NumberStyle {
    Default,
    Stars,
    Slider,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SchemaItem {
    pub name: String,
    pub value: SchemaAttrType,
}

pub type SchemaItems = Vec<SchemaItem>;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Schema {
    pub name: String,
    pub version: String,

    #[ts(optional)]
    pub fill_from_filename: Option<String>,
    #[ts(optional)]
    pub fill_api_search_from: Option<String>,

    pub items: SchemaItems,
}

pub const SCHEMA_VERSION: &str = "1.0";

#[derive(Serialize, TS, Clone, Debug, Deserialize)]
pub struct SchemaLocation {
    pub schema_path: PathBuf,
    pub schema_owner_folder: PathBuf,
}
