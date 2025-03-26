use std::collections::HashMap;

use crate::schema::types::{AttrValue, DatePair, Schema, SchemaAttrType};
use crate::utils::errorhandling::ErrFR;

pub fn parse_metadata(
    front_matter: &str,
    schema: &Schema,
) -> Result<HashMap<String, AttrValue>, ErrFR> {
    let parsed_meta: Result<HashMap<String, serde_yml::Value>, serde_yml::Error> =
        serde_yml::from_str(&front_matter);

    match parsed_meta {
        Ok(parse_res) => {
            let mut file_meta: HashMap<String, AttrValue> = HashMap::new();

            for schema_i in schema.items.clone() {
                let name = schema_i.name;

                let attribute_type = parse_res.get(&name);

                match (attribute_type, schema_i.value) {
                    (
                        Some(serde_yml::Value::String(s)),
                        SchemaAttrType::Text(_)
                        | SchemaAttrType::Image(_)
                        | SchemaAttrType::Date(_),
                    ) => {
                        file_meta.insert(name, AttrValue::String(Some(s.to_owned())));
                    }

                    (
                        Some(serde_yml::Value::Number(n)),
                        SchemaAttrType::Number(number_settings),
                    ) => {
                        if number_settings.decimal_places.is_some()
                            && number_settings.decimal_places.unwrap() > 0
                        {
                            file_meta.insert(name, AttrValue::Float(n.as_f64()));
                        } else {
                            file_meta.insert(name, AttrValue::Integer(n.as_i64()));
                        }
                    }

                    (
                        Some(serde_yml::Value::Sequence(vec)),
                        SchemaAttrType::TextCollection(_) | SchemaAttrType::DateCollection(_),
                    ) => {
                        let arr: Vec<String> = vec
                            .iter()
                            .filter_map(|v| match v.as_str() {
                                Some(s) => Some(s.to_string()),
                                None => None,
                            })
                            .collect();

                        file_meta.insert(
                            name,
                            AttrValue::StringVec(match arr.len() {
                                0 => None,
                                _ => Some(arr),
                            }),
                        );
                    }

                    (
                        Some(serde_yml::Value::Sequence(vec)),
                        SchemaAttrType::DatesPairCollection(_),
                    ) => {
                        let arr: Vec<DatePair> = vec
                            .iter()
                            .filter_map(|v| match v.as_mapping() {
                                Some(s) => {
                                    let started = s.get("started");
                                    let finished = s.get("finished");

                                    if started.is_none() && finished.is_none() {
                                        return None;
                                    }

                                    Some(DatePair {
                                        started: started
                                            .and_then(|v| v.as_str())
                                            .and_then(|v| Some(v.to_string())),
                                        finished: finished
                                            .and_then(|v| v.as_str())
                                            .and_then(|v| Some(v.to_string())),
                                    })
                                }
                                None => None,
                            })
                            .collect();

                        file_meta.insert(
                            name,
                            AttrValue::DatePairVec(match arr.len() {
                                0 => None,
                                _ => Some(arr),
                            }),
                        );
                    }

                    (
                        _,
                        SchemaAttrType::Text(_)
                        | SchemaAttrType::Image(_)
                        | SchemaAttrType::Date(_),
                    ) => {
                        file_meta.insert(name, AttrValue::String(None));
                    }
                    (_, SchemaAttrType::Number(number_settings)) => {
                        if number_settings.decimal_places.is_some()
                            && number_settings.decimal_places.unwrap() > 0
                        {
                            file_meta.insert(name, AttrValue::Float(None));
                        } else {
                            file_meta.insert(name, AttrValue::Integer(None));
                        }
                    }
                    (_, SchemaAttrType::TextCollection(_) | SchemaAttrType::DateCollection(_)) => {
                        file_meta.insert(name, AttrValue::StringVec(None));
                    }
                    (_, SchemaAttrType::DatesPairCollection(_)) => {
                        file_meta.insert(name, AttrValue::DatePairVec(None));
                    }
                }
            }

            Ok(file_meta)
        }
        Err(e) => Err(ErrFR::new("Parsing error")
            .info("Metadata might be lost on save")
            .raw(e)),
    }
}

#[cfg(test)]
mod tests {
    use crate::schema::types::{
        EmptySettings, NumberSettings, Schema, SchemaItem, TextCollectionSettings, TextSettings,
    };

    use super::*;

    const METADATA_CORRECT: &str = "title: some guy
year: 2024
myRating: 2.5
read:
  - started: s1
    finished: f1
  - started: s2
  - finished: f3
tags:
  - tag1
  - tag2
";

    const METADATA_WRONG_TYPES_1: &str = "title: 2024
year: hello
myRating: 
    - tag1
read: 444.444
tags:
  - started: s1
    finished: f1
  - started: s2
  - finished: f3
";

    const METADATA_WRONG_TYPES_2: &str = "title: 2024
year: hello
myRating: 'pososi'
read: 444.444
tags: 555
";

    fn schema_with_all_types() -> Schema {
        Schema {
            name: "test".to_owned(),
            version: "1".to_owned(),
            icon: None,
            items: vec![
                SchemaItem {
                    name: "title".to_owned(),
                    value: SchemaAttrType::Text(TextSettings {
                        ..TextSettings::default()
                    }),
                },
                SchemaItem {
                    name: "year".to_owned(),
                    value: SchemaAttrType::Number(NumberSettings {
                        ..NumberSettings::default()
                    }),
                },
                SchemaItem {
                    name: "myRating".to_owned(),
                    value: SchemaAttrType::Number(NumberSettings {
                        decimal_places: Some(2),
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
            ],
        }
    }

    #[test]
    fn all_correct() {
        let schema_with_all_types = schema_with_all_types();

        let all_correct = parse_metadata(METADATA_CORRECT, &schema_with_all_types);

        let all_correct_expected: HashMap<String, AttrValue> = HashMap::from([
            ("title".into(), AttrValue::String(Some("some guy".into()))),
            ("year".into(), AttrValue::Integer(Some(2024))),
            ("myRating".into(), AttrValue::Float(Some(2.5))),
            (
                "read".into(),
                AttrValue::DatePairVec(Some(vec![
                    DatePair {
                        started: Some("s1".into()),
                        finished: Some("f1".into()),
                    },
                    DatePair {
                        started: Some("s2".into()),
                        finished: None,
                    },
                    DatePair {
                        started: None,
                        finished: Some("f3".into()),
                    },
                ])),
            ),
            (
                "tags".into(),
                AttrValue::StringVec(Some(vec!["tag1".into(), "tag2".into()])),
            ),
        ]);

        assert!(all_correct.is_ok(), "All correct parse is ok");
        assert_eq!(
            all_correct.unwrap(),
            all_correct_expected,
            "All correct parse is as expected"
        );
    }

    #[test]
    fn all_none() {
        let schema_with_all_types = schema_with_all_types();

        let all_none_expected: HashMap<String, AttrValue> = HashMap::from([
            ("title".into(), AttrValue::String(None)),
            ("year".into(), AttrValue::Integer(None)),
            ("myRating".into(), AttrValue::Float(None)),
            ("read".into(), AttrValue::DatePairVec(None)),
            ("tags".into(), AttrValue::StringVec(None)),
        ]);

        let all_none = parse_metadata("", &schema_with_all_types);

        assert!(all_none.is_ok(), "All none parse is ok");
        assert_eq!(
            all_none.unwrap(),
            all_none_expected,
            "All none parse is as expected"
        );
    }

    #[test]
    fn wrong_types_() {
        let schema_with_all_types = schema_with_all_types();

        let all_none_expected: HashMap<String, AttrValue> = HashMap::from([
            ("title".into(), AttrValue::String(None)),
            ("year".into(), AttrValue::Integer(None)),
            ("myRating".into(), AttrValue::Float(None)),
            ("read".into(), AttrValue::DatePairVec(None)),
            ("tags".into(), AttrValue::StringVec(None)),
        ]);

        let first_wrong = parse_metadata(METADATA_WRONG_TYPES_1, &schema_with_all_types);
        let second_wrong = parse_metadata(METADATA_WRONG_TYPES_2, &schema_with_all_types);

        assert!(first_wrong.is_ok(), "First wrong parse is ok");
        assert_eq!(
            first_wrong.unwrap(),
            all_none_expected,
            "First wrong parse is as expected"
        );

        assert!(second_wrong.is_ok(), "Second wrong parse is ok");
        assert_eq!(
            second_wrong.unwrap(),
            all_none_expected,
            "Second wrong parse is as expected"
        );
    }
}
