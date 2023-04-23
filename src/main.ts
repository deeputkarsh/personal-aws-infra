#!/usr/bin/env node
import 'source-map-support/register'
import App from './App'
import { validateEnv } from './config'

validateEnv()
const app = new App()
app.createStacks()
