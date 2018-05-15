from service.models import MasterSheet, PRISSheet, Reactor, OperatingHistorySheet, Operation

STATUS_MAP = {
    "Operational" : "Operable"
}

def import_reactordb(master_path, pris_path, history_path):

    # first thing to do is drop the preview indexes ("next"), so the following import
    # can re-create them
    Reactor.drop_next()
    Operation.drop_next()

    master = MasterSheet(master_path)
    pris = PRISSheet(pris_path)
    history = OperatingHistorySheet(history_path)

    # read the pris reactors into a dictionary that we can use for lookup
    scrape = {}
    for p in pris.objects():
        scrape[p.get("reactor_name")] = p

    # do the same for the operating history
    oh = {}
    for d in history.dataobjs(Operation):
        if d.reactor in oh:
            oh[d.reactor].append(d)
        else:
            oh[d.reactor] = [d]

    # only import records which have a value in the master spreadsheet
    for obj in master.objects():
        # get the pris record if there is one
        pris_record = scrape.get(obj.get("reactor_name"))

        # get the operational history if it exists
        histories = oh.get(obj.get("reactor_name"), [])

        # use the reactor name as the id too
        obj["id"] = obj["reactor_name"]

        # now write the values from the pris record to the master record if
        # the master does not have a value
        if pris_record is not None:
            for k, v in pris_record.iteritems():
                if k not in obj:
                    obj[k] = v
                elif obj[k] is None:
                    obj[k] = v

        # overwrite the reactor name if an wna_name has been provided
        if obj.get("wna_name", None) is not None:
            obj["reactor_name"] = obj["wna_name"]
            del obj["wna_name"]

        # finally check the master for the "delete value" marker (a "-")
        for k, v in obj.items():
            if v == "-":
                del obj[k]

        # translate the status to the internally preferred value if necessary
        obj["status"] = STATUS_MAP.get(obj.get("status"), obj.get("status"))

        # for all the operation histories for this reactor, also extract the information we want
        # to store against it
        load_factor = {}
        energy_availability = {}
        electricity_supplied = {}
        rups = {}
        for h in histories:
            lf = h.load_factor_annual
            ea = h.energy_availability_factor_annual
            es = h.electricity_supplied
            rup = h.reference_unit_power
            year = h.year
            if lf is None:
                lf = 0.0
            if ea is None:
                ea = 0.0
            if es is None:
                es = 0.0
            if rup is None:
                rup = 0.0
            load_factor[str(year)] = float(lf)
            energy_availability[str(year)] = float(ea)
            electricity_supplied[year] = float(es)
            rups[year] = float(rup)

        obj["load_factor"] = load_factor
        obj["energy_availability"] = energy_availability
        obj["reference_unit_power"] = rups

        electricity_supplied_cumulative = {}
        es_years = electricity_supplied.keys()
        es_years.sort()
        total = 0.0
        for year in es_years:
            total += electricity_supplied[year]
            electricity_supplied_cumulative[str(year)] = total
        obj["electricity_supplied_cumulative"] = electricity_supplied_cumulative

        # make and populate a reactor object, then save it
        r = Reactor()
        r.populate(obj)
        r.save()

        # save the operational history
        for h in histories:
            h.country = r.country
            h.save()



