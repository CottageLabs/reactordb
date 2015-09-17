# Reactor Database Data Models

## Reactor

```json
{
    "id" : "<id for the reactor: normalised reactor name>",
    "created_date" : "<date the record was created>",
    "last_updated" : "<date the record was last modified: will most likely be the same as created_date in all cases>",
    
    "reactor" : {
        "name" : "<standard reactor name>",
        "alternative_name" : "<alternative name for this reactor>",
        "url" : "<reactor website>"
        
        "site_name" : "<name of the site>"
        "site_id" : "<WNA site id>",
        
        "owner" : [
            {"name" : "<name of the owner>", "share" : "<share of ownership (e.g. %)>"}
        ]
        "operator" : "<operator of the reactor>",
        "vendor" : "<vendor of the reactor>",
        "model" : "<reactor model name>",
        "process" : "<reactor process type>",
        "type" : "<type of reactor (e.g. commercial)>",
        
        "continent" : "<continent the reactor lies on>",
        "country" : "<country the reactor lies in>",
        "area" : "<sub-country area>",
        "location" : {
            "lat": <latitude>,
            "lon" : <longitude>
        }
        "site_location" : {
            "lat": <latitude>,
            "lon" : <longitude>
        }
        
        "first_grid_connection" : "<first grid connection date (YYYY-MM-DD)>",
        "first_criticality" : "<first criticality date (YYYY-MM-DD)>",
        "construction_suspend" : "<construction suspend date (YYYY-MM-DD)>",
        "commercial_operation" : "<commercial operation date (YYYY-MM-DD)>",
        "permanent_shutdown" : "<permanent shutdown date (YYYY-MM-DD)>",
        "longterm_shutdown" : "<long term shutdown date (YYYY-MM-DD)>",
        "construction_restart" : "<construction restart date (YYYY-MM-DD)>",
        "construction_start" : "<construction start date (YYYY-MM-DD)>",
        "restart" : "<restart date (YYYY-MM-DD)>",
        "first_concrete" : "<first concrete date (YYYY-MM-DD)>",
        "contract_year" : <4 digit year>,
        
        "reference_unit_power" : <reference unit power, Units?, float>,
        "thermal_capacity" : <thermal capacity, Units?, float>,
        "design_net_capacity" : <design net capacity, Units?, float>,
        "gross_capacity" : "<gross capacity, Units?, float>,
        
        "status" : "<operational status of the reactor at this time>",
        
        "links" : [
            {
                "type" : "<wna|wnn>",
                "url" : "<url>",
                "text" : "<link text>"
            }
        ],
        
        "additional_info" : "<additional textual information>"
    },
    
    "admin" : {
        "visible" : <displayed in search: true|false>
    },
    
    "index" : {
        "sort_name" : "<name field, suitably normalised for sorting>",
        "first_grid_connection_year" : <4 digit year from first_grid_connection>,
        "permanent_shutdown_year" : <4 digit year from permanent_shutdown>,
        "construction_start_year" : <4 digit year from construction_start>
    }
    
}
```

## Operational History

```json
{
    "id" : "<opaque id for this history record>",
    "created_date" : "<date the record was created>",
    "last_updated" : "<date the record was last modified: will most likely be the same as created_date in all cases>",
    
    "reactor" : "<id of reactor this is a history record for>",
    "year" : <4 digit year this is a history record for>,
    
    "electricity_supplied" : <electricity supplied, Unit? float>,
    "reference_unit_power" : <reference unit power, Unit? float>,
    "annual_time_online" : <annual time online, Unit? float>,
    "operation_factor" : <operation factor, Unit? float>,
    "energy_availability_factor_annual" : <energy availability factor annual, Unit? float>,
    "energy_availability_factor_cumulative" : <energy availability factor cumulative, Unit? float>,
    "load_factor" : <load factor, Unit? float>,
    "load_factor_cumulative" : <load factor cumulative, Unit? float>,
    
    "comment" : "<any comments associated with this history record>
}
```