<script lang="ts">
    type Todo = {
        text: string;
        completed: boolean;
    };

    let todos = $state<Todo[]>([
        { text: 'Learn Svelte', completed: false },
        { text: 'Learn SvelteKit', completed: false },
        { text: 'Build something awesome', completed: false },
    ]);

    const add = (text: string) => {
        todos.push({
            text,
            completed: false,
        }); 
    }

    const completed = $derived(todos.filter(todo => todo.completed).length);
</script>

<h1>My Todos</h1>

{#each todos as todo, i (todo.text)}
    <div>
        <input type="checkbox" bind:checked={todo.completed} />
        <span>{todo.text}</span>
    </div>
{/each}

<p>{completed}/{todos.length} completed</p>

<button class="btn btn-primary" onclick={() => {
    const text = prompt('What do you need to do?');
    if (text) {
        add(text);
    }
}}>Add</button>