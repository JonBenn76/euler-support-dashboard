import os
import jinja2

class QueryBuilder:
    def __init__(self, sql_dir: str):
        self.env = jinja2.Environment(loader=jinja2.FileSystemLoader(sql_dir))
        
    def render(self, template_name: str, **kwargs):
        params = []
        
        def bind(value):
            params.append(value)
            return "?"
            
        template = self.env.get_template(template_name)
        kwargs['bind'] = bind
        query = template.render(**kwargs)
        return query, params

# Create a singleton instance for the app
sql_dir = os.path.join(os.path.dirname(__file__), "sql")
builder = QueryBuilder(sql_dir)

def render_query(template_name: str, **kwargs):
    return builder.render(template_name, **kwargs)
