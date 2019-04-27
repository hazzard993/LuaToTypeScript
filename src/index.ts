#!/usr/bin/env node
import { transpile } from "./cli";

transpile(process.argv.splice(2));
