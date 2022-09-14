import { Currency } from "@medusajs/medusa"
import { useAdminCurrencies, useAdminUpdateStore } from "medusa-react"
import React, { useContext, useState } from "react"
import { usePagination, useRowSelect, useSortBy, useTable } from "react-table"
import Button from "../../../../../components/fundamentals/button"
import Modal from "../../../../../components/molecules/modal"
import { LayeredModalContext } from "../../../../../components/molecules/modal/layered-modal"
import useNotification from "../../../../../hooks/use-notification"
import { getErrorMessage } from "../../../../../utils/error-messages"
import { useEditCurrenciesModal } from "./edit-currencies-modal"
import CurrenciesTable from "./table"
import { useCurrencyColumns } from "./use-currency-table-columns"

const LIMIT = 15

const AddCurrenciesScreen = () => {
  const [offset, setOffset] = useState(0)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])

  const { onClose, store } = useEditCurrenciesModal()
  const { reset, pop } = useContext(LayeredModalContext)

  const { currencies, count, status } = useAdminCurrencies(
    {
      limit: LIMIT,
      offset,
    },
    {
      keepPreviousData: true,
    }
  )

  const { mutate } = useAdminUpdateStore()
  const notification = useNotification()

  const onSubmit = (next: () => void) => {
    mutate(
      {
        currencies: [
          ...store.currencies.map((curr) => curr.code),
          ...selectedRowIds,
        ],
      },
      {
        onSuccess: () => {
          notification("Success", "Successfully updated currencies", "success")
          next()
        },
        onError: (err) => {
          notification("Error", getErrorMessage(err), "error")
        },
      }
    )
  }

  const filteredData = React.useMemo(() => {
    const codes = store.currencies.map((curr) => curr.code) || []
    return currencies?.filter(({ code }) => !codes.includes(code)) || []
  }, [currencies, store])

  const columns = useCurrencyColumns()

  const tableState = useTable<Currency>(
    {
      data: filteredData || [],
      columns,
      manualPagination: true,
      initialState: {
        pageIndex: Math.floor(offset / LIMIT),
        pageSize: LIMIT,
      },
      autoResetPage: false,
      autoResetSelectedRows: false,
      getRowId: (row) => row.code,
      pageCount: Math.ceil((count || 0) / LIMIT),
      defaultColumn: {
        width: "auto",
      },
    },
    useSortBy,
    usePagination,
    useRowSelect
  )

  if (status === "error") {
    return <div>Failed to load</div>
  }

  if (status === "loading" && !currencies) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Modal.Content>
        <CurrenciesTable
          setQuery={() => {}}
          setSelectedRowIds={setSelectedRowIds}
          count={count || 0}
          tableState={tableState}
          setOffset={setOffset}
          limit={LIMIT}
          offset={offset}
        />
      </Modal.Content>
      <Modal.Footer>
        <div className="w-full gap-x-xsmall flex items-center justify-end">
          <Button variant="secondary" size="small" onClick={pop}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={() =>
              onSubmit(() => {
                pop()
              })
            }
          >
            Save and go back
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={() =>
              onSubmit(() => {
                reset()
                onClose()
              })
            }
          >
            Save and close
          </Button>
        </div>
      </Modal.Footer>
    </>
  )
}

export const useAddCurrenciesModalScreen = () => {
  const { pop, push } = useContext(LayeredModalContext)

  return {
    screen: {
      title: "Add Store Currencies",
      onBack: pop,
      view: <AddCurrenciesScreen />,
    },
    push,
  }
}

export default AddCurrenciesScreen
