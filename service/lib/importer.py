from service.models import MasterSheet, PRISSheet, Reactor, OperatingHistorySheet, Operation

def import_reactordb(master_path, pris_path, history_path):
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

        # overwrite the reactor name if an wna_name has been provided
        if obj.get("wna_name", "") != "":
            obj["reactor_name"] = obj["wna_name"]
            del obj["wna_name"]

        # now write the values from the pris record to the master record if
        # the master does not have a value
        if pris_record is not None:
            for k, v in pris_record.iteritems():
                if k not in obj:
                    obj[k] = v
                elif obj[k] is None:
                    obj[k] = v

        # finally check the master for the "delete value" marker (a "-")
        for k, v in obj.items():
            if v == "-":
                del obj[k]

        # make and populate a reactor object, then save it
        r = Reactor()
        r.populate(obj)
        r.save()

        # save the operational history
        for h in histories:
            h.save()



