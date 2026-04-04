from django import template

register = template.Library()

@register.filter(name='split')
def split(value, separator=','):
    """Split string by separator"""
    if value:
        return value.split(separator)
    return []

@register.filter(name='trim')
def trim(value):
    """Strip whitespace from string"""
    if value:
        return value.strip()
    return ''
