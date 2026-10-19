import { createContext } from 'svelte';

import type { ProjectDrawer } from './drawer.svelte';
import type { Uploader } from './upload.svelte';

const [getUploader, setUploader] = createContext<Uploader>();
const [getProjectDrawer, setProjectDrawer] = createContext<ProjectDrawer>();

export { getProjectDrawer, getUploader, setProjectDrawer, setUploader };
