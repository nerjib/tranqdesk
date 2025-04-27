import { AppWrapper } from '../../components/shared/Layout'
import AppNav from '../../components/layout/AppNav'
import AppMain from '../../components/layout/AppMain'
import { useState } from 'react'
import './index.css'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  const [activeTab, setActiveTab] = useState('form');

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
  };
  return (
    <AppWrapper>
        <AppNav activeTab={activeTab} changeTab={handleChangeTab} />
        <AppMain activeTab={activeTab} />
      </AppWrapper>
  )
}

export default App

