import { Spinner } from "@nextui-org/react"

const Loading = ({ loadingText }) => {
  return (
    <div className="loading">
      <Spinner color="success" label={loadingText} labelColor="success" size="lg"/>
    </div>
  )
}

export default Loading