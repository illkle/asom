use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use ts_rs::TS;

#[derive(Serialize, Deserialize, Clone, Hash, Debug, PartialEq, TS)]
#[ts(export)]
pub struct DateRead {
    #[ts(optional)]
    pub started: Option<String>,
    #[ts(optional)]
    pub finished: Option<String>,
}

/*
    AttrValue represents types that can be found in frontmatter.
    They MUST be uniquely identifiable by type inside.

    It would be better to have them tagged in typerscript. However not saving them as tagged to frontmatter is a must.
*/
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(untagged)]
pub enum AttrValue {
    String(Option<String>),
    StringVec(Option<Vec<String>>),
    DateReadVec(Option<Vec<DateRead>>),
    Integer(Option<i64>),
    Float(Option<f64>),
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(tag = "type", content = "settings")]
pub enum SchemaAttrType {
    Text(TextSettings),
    TextCollection(TextCollectionSettings),
    Number(NumberSettings),
    Date(EmptySettings),
    DateCollection(EmptySettings),
    DatesPairCollection(EmptySettings),
    Image(EmptySettings),
}

/*
    These types are not needed in rust, but useful in typescript
    Typescript confuses types with common fields unless they have unuique identificator:
    The proper way in TS is extends, but rust has no inheritance and we rely on typegen
*/
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SettingsTypeText {
    Text,
}

impl Default for SettingsTypeText {
    fn default() -> Self {
        SettingsTypeText::Text
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SettingsTypeNumber {
    Num,
}

impl Default for SettingsTypeNumber {
    fn default() -> Self {
        SettingsTypeNumber::Num
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SettingsTypeTextCollection {
    TextCollection,
}

impl Default for SettingsTypeTextCollection {
    fn default() -> Self {
        SettingsTypeTextCollection::TextCollection
    }
}

/*
   #[ts(optional)] means use val?: String instean of val: String | null
   It's mandatory everywhere, because you can't v-model String | null in radix-vue.
   Hopefully this gets merged soon and it can be set on struct level
   https://github.com/Aleph-Alpha/ts-rs/pull/366

   (the same thing for serde is  #[serde_with::skip_serializing_none] btw)
*/

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[serde_with::skip_serializing_none]
pub struct TextSettings {
    #[serde(default)]
    pub settings_type: SettingsTypeText,
    #[ts(optional)]
    pub display_name: Option<String>,
    #[ts(optional)]
    pub size: Option<InputSize>,
    #[ts(optional)]
    pub font: Option<TextFont>,
    #[ts(optional)]
    pub weight: Option<TextWeight>,
    #[ts(optional)]
    pub theme: Option<TextTheme>,
    #[ts(optional)]
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
            theme: None,
            is_multiline: None,
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
#[serde_with::skip_serializing_none]
pub struct NumberSettings {
    #[serde(default)]
    pub settings_type: SettingsTypeNumber,

    #[ts(optional)]
    pub display_name: Option<String>,
    #[ts(optional)]
    pub size: Option<InputSize>,
    #[ts(optional)]
    pub min: Option<f64>,
    #[ts(optional)]
    pub max: Option<f64>,
    #[ts(optional)]
    pub style: Option<NumberStyle>,
    #[ts(optional)]
    pub decimal_places: Option<u8>,
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
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
#[serde_with::skip_serializing_none]
pub struct TextCollectionSettings {
    #[serde(default)]
    pub settings_type: SettingsTypeTextCollection,
    #[ts(optional)]
    pub display_name: Option<String>,
    #[ts(optional)]
    pub size: Option<InputSize>,
    #[ts(optional)]
    pub font: Option<TextFont>,
    #[ts(optional)]
    pub weight: Option<TextWeight>,
    #[ts(optional)]
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
#[ts(export)]
pub struct EmptySettings {}

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
pub enum TextTheme {
    Hidden,
    Default,
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
    pub icon: Option<String>,

    pub items: SchemaItems,

    pub internal_path: String,
    // This is used to prefix table names in cache db
    // Currently is equal to folder name, will need to be random when\if we support multiple folders
    // Can possibly be used for schema cache invalidation
    pub internal_name: String,
}

pub const SCHEMA_VERSION: &str = "1.0";
