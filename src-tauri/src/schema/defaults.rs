use crate::schema::types::{
    EmptySettings, NumberSettings, TextCollectionSettings, TextSettings, SCHEMA_VERSION,
};

use super::types::{
    InputSize, NumberStyle, Schema, SchemaAttrType, SchemaItem, SchemaItems, TextFont, TextWeight,
};

pub fn default_book_schema() -> SchemaItems {
    vec![
        SchemaItem {
            name: "title".to_owned(),
            value: SchemaAttrType::Text(TextSettings {
                size: Some(InputSize::L),
                font: Some(TextFont::Serif),
                is_multiline: Some(true),
                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "author".to_owned(),
            value: SchemaAttrType::Text(TextSettings {
                size: Some(InputSize::M),
                weight: Some(TextWeight::Bold),
                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "year".to_owned(),
            value: SchemaAttrType::Number(NumberSettings {
                size: Some(InputSize::S),
                min: Some(0.0),
                ..NumberSettings::default()
            }),
        },
        SchemaItem {
            name: "myRating".to_owned(),
            value: SchemaAttrType::Number(NumberSettings {
                min: Some(0.0),
                max: Some(5.0),
                decimal_places: Some(1),
                style: Some(NumberStyle::Stars),
                ..NumberSettings::default()
            }),
        },
        SchemaItem {
            name: "read".to_owned(),
            value: SchemaAttrType::DatesPairCollection(EmptySettings {}),
        },
        SchemaItem {
            name: "tags".to_owned(),
            value: SchemaAttrType::TextCollection(TextCollectionSettings {
                prefix: Some("#".to_owned()),
                ..TextCollectionSettings::default()
            }),
        },
        SchemaItem {
            name: "cover".to_owned(),
            value: SchemaAttrType::Image(EmptySettings {}),
        },
        SchemaItem {
            name: "ISBN13".to_owned(),
            value: SchemaAttrType::Number(NumberSettings {
                size: Some(InputSize::S),
                min: Some(0.0),
                ..NumberSettings::default()
            }),
        },
    ]
}

pub fn default_movie_schema() -> SchemaItems {
    vec![
        SchemaItem {
            name: "title".to_owned(),
            value: SchemaAttrType::Text(TextSettings {
                size: Some(InputSize::L),
                font: Some(TextFont::Serif),
                is_multiline: Some(true),

                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "director".to_owned(),
            value: SchemaAttrType::Text(TextSettings {
                size: Some(InputSize::M),
                weight: Some(TextWeight::Bold),
                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "premiere".to_owned(),
            value: SchemaAttrType::Date(EmptySettings {}),
        },
        SchemaItem {
            name: "myRating".to_owned(),
            value: SchemaAttrType::Number(NumberSettings {
                min: Some(0.0),
                max: Some(5.0),
                style: Some(NumberStyle::Slider),
                ..NumberSettings::default()
            }),
        },
        SchemaItem {
            name: "watched".to_owned(),
            value: SchemaAttrType::DateCollection(EmptySettings {}),
        },
        SchemaItem {
            name: "tags".to_owned(),
            value: SchemaAttrType::TextCollection(TextCollectionSettings {
                prefix: Some("#".to_owned()),
                ..TextCollectionSettings::default()
            }),
        },
        SchemaItem {
            name: "poster".to_owned(),
            value: SchemaAttrType::Image(EmptySettings {}),
        },
    ]
}

pub fn default_game_schema() -> SchemaItems {
    vec![
        SchemaItem {
            name: "title".to_owned(),
            value: SchemaAttrType::Text(TextSettings {
                size: Some(InputSize::L),
                font: Some(TextFont::Serif),
                is_multiline: Some(true),

                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "publisher".to_owned(),
            value: SchemaAttrType::Text(TextSettings {
                size: Some(InputSize::M),
                weight: Some(TextWeight::Bold),
                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "releaseDate".to_owned(),
            value: SchemaAttrType::Date(EmptySettings {}),
        },
        SchemaItem {
            name: "myRating".to_owned(),
            value: SchemaAttrType::Number(NumberSettings {
                min: Some(0.0),
                max: Some(10.0),
                style: Some(NumberStyle::Slider),
                ..NumberSettings::default()
            }),
        },
        SchemaItem {
            name: "played".to_owned(),
            value: SchemaAttrType::DatesPairCollection(EmptySettings {}),
        },
        SchemaItem {
            name: "tags".to_owned(),
            value: SchemaAttrType::TextCollection(TextCollectionSettings {
                prefix: Some("#".to_owned()),
                ..TextCollectionSettings::default()
            }),
        },
        SchemaItem {
            name: "cover".to_owned(),
            value: SchemaAttrType::Image(EmptySettings {}),
        },
    ]
}

pub fn get_default_schemas() -> Vec<Schema> {
    vec![
        Schema {
            name: "Books".to_owned(),
            version: SCHEMA_VERSION.to_owned(),
            icon: None,
            items: default_book_schema(),
        },
        Schema {
            name: "Movies".to_owned(),
            version: SCHEMA_VERSION.to_owned(),
            icon: None,
            items: default_movie_schema(),
        },
        Schema {
            name: "Games".to_owned(),
            version: SCHEMA_VERSION.to_owned(),
            icon: None,
            items: default_game_schema(),
        },
    ]
}
